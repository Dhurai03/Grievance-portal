import os
import sys

# Force pure PyTorch, bypass broken TensorFlow DLL on Windows
os.environ["USE_TF"] = "0"
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import joblib
import numpy as np
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from similarity_engine import compute_similarity, get_sentence_transformer

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DEPT_MODEL_PATH = os.path.join(CURRENT_DIR, "department_model.joblib")
URGENCY_MODEL_PATH = os.path.join(CURRENT_DIR, "urgency_model.joblib")

app = FastAPI(title="EduGrieve AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Scikit-Learn Pipelines
dept_pipeline = None
urgency_pipeline = None

try:
    if os.path.exists(DEPT_MODEL_PATH):
        dept_pipeline = joblib.load(DEPT_MODEL_PATH)
        print("[AI Engine] Department classification model loaded successfully.")
    else:
        print("[AI Engine] Warning: Department model not found at", DEPT_MODEL_PATH)
except Exception as e:
    print("[AI Engine] Error loading department model:", e)

try:
    if os.path.exists(URGENCY_MODEL_PATH):
        urgency_pipeline = joblib.load(URGENCY_MODEL_PATH)
        print("[AI Engine] Urgency classification model loaded successfully.")
    else:
        print("[AI Engine] Warning: Urgency model not found at", URGENCY_MODEL_PATH)
except Exception as e:
    print("[AI Engine] Error loading urgency model:", e)

# Pre-warm Sentence Transformer
try:
    get_sentence_transformer()
except Exception as e:
    print("[AI Engine] Pre-warming SentenceTransformer error:", e)


# Pydantic Request Models
class TextRequest(BaseModel):
    text: str

class CandidateGrievance(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    trackingId: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None

class SimilarityRequest(BaseModel):
    query: str
    grievances: List[CandidateGrievance]
    threshold: Optional[float] = 0.40

class AnalyzeAllRequest(BaseModel):
    text: str
    title: Optional[str] = ""
    candidates: Optional[List[CandidateGrievance]] = []


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "EduGrieve AI Microservice",
        "documentation": "/docs",
        "health": "/api/ai/health"
    }

@app.get("/api/ai/health")
def health():
    return {
        "status": "online",
        "service": "EduGrieve AI Microservice",
        "dept_model_loaded": dept_pipeline is not None,
        "urgency_model_loaded": urgency_pipeline is not None,
        "sentence_transformer_loaded": get_sentence_transformer() is not None,
        "techniques": [
            "Core AI: TF-IDF + Logistic Regression (Department & Category)",
            "Recommended AI: Sentence Transformers + Cosine Similarity (Duplicate Detection)",
            "Recommended AI: Supervised Text Classifier (Complaint Severity & Urgency)"
        ]
    }


@app.post("/api/ai/classify")
def classify_department(req: TextRequest):
    """
    Core AI: NLP-Based Department and Category Classification
    Technique: TF-IDF + Logistic Regression
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text description is required.")

    if dept_pipeline is None:
        raise HTTPException(status_code=500, detail="Department model not loaded.")

    try:
        raw_text = req.text.strip()
        pred = dept_pipeline.predict([raw_text])[0]
        probs = dept_pipeline.predict_proba([raw_text])[0]
        classes = dept_pipeline.classes_

        conf = float(np.max(probs))
        dept, subcat, code = pred.split("|||")

        top_classes = []
        for cls_name, prob in zip(classes, probs):
            d, s, c = cls_name.split("|||")
            top_classes.append({
                "department": d,
                "subcategory": s,
                "departmentCode": c,
                "probability": round(float(prob), 4)
            })
        top_classes.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "category": dept,
            "department": dept,
            "subcategory": subcat,
            "departmentCode": code,
            "confidence": round(conf, 4),
            "topPredictions": top_classes[:3],
            "technique": "TF-IDF + Logistic Regression",
            "model": "scikit-learn-tfidf-logreg"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/urgency")
def detect_urgency(req: TextRequest):
    """
    Recommended AI: Complaint Severity and Urgency Detection
    Technique: A separate text classifier trained on labelled examples.
    Does not rely solely on sentiment; detects genuine time consequence and risk.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text description is required.")

    if urgency_pipeline is None:
        raise HTTPException(status_code=500, detail="Urgency model not loaded.")

    try:
        raw_text = req.text.strip()
        pred = urgency_pipeline.predict([raw_text])[0]
        probs = urgency_pipeline.predict_proba([raw_text])[0]
        classes = urgency_pipeline.classes_

        class_prob_map = {cls_name: float(prob) for cls_name, prob in zip(classes, probs)}
        conf = float(np.max(probs))

        # Calculate a weighted urgency score from 0.0 to 1.0
        weights = {"LOW": 0.15, "MEDIUM": 0.50, "HIGH": 0.80, "CRITICAL": 1.00}
        urgency_score = sum(class_prob_map.get(k, 0.0) * weights.get(k, 0.5) for k in weights)

        # Flag for immediate staff review if High or Critical with significant confidence
        flag_review = bool(pred in ["CRITICAL", "HIGH"] or urgency_score >= 0.70)

        # Determine recommended SLA duration based on urgency
        sla_hours_map = {
            "CRITICAL": 24,
            "HIGH": 48,
            "MEDIUM": 72,
            "LOW": 120
        }

        return {
            "urgency": pred,
            "confidence": round(conf, 4),
            "urgencyScore": round(float(urgency_score), 4),
            "flagForImmediateReview": flag_review,
            "recommendedSlaHours": sla_hours_map.get(pred, 72),
            "classProbabilities": {k: round(v, 4) for k, v in class_prob_map.items()},
            "technique": "Separate Supervised Text Classifier (TF-IDF + Logistic Regression)",
            "model": "urgency-classifier-v1"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/similar")
def find_similar(req: SimilarityRequest):
    """
    Recommended AI: Duplicate and Similar Grievance Detection
    Technique: Sentence Transformers + Cosine Similarity
    """
    try:
        candidates_dict = [g.model_dump() for g in req.grievances]
        matches = compute_similarity(req.query, candidates_dict, threshold=req.threshold or 0.40)
        has_duplicate = any(m["isDuplicate"] for m in matches)
        return {
            "matches": matches,
            "totalMatches": len(matches),
            "hasDuplicate": has_duplicate,
            "topMatch": matches[0] if matches else None,
            "technique": "Sentence Transformers (all-MiniLM-L6-v2) + Cosine Similarity"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-all")
def analyze_all(req: AnalyzeAllRequest):
    """
    Comprehensive AI Analysis:
    Combines Department Routing, Urgency Estimation, and Duplicate Detection
    """
    full_text = f"{req.title} {req.text}".strip()
    
    classification = classify_department(TextRequest(text=full_text))
    urgency_res = detect_urgency(TextRequest(text=full_text))

    similar_res = {"matches": [], "totalMatches": 0, "hasDuplicate": False, "topMatch": None}
    if req.candidates:
        similar_res = find_similar(SimilarityRequest(
            query=full_text,
            grievances=req.candidates,
            threshold=0.40
        ))

    return {
        "classification": classification,
        "urgency": urgency_res,
        "similarity": similar_res
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"[AI Service] Starting EduGrieve AI Microservice on http://127.0.0.1:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
