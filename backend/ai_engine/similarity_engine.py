import os
import sys

# Crucial: Disable broken TensorFlow import on Windows, force pure PyTorch
os.environ["USE_TF"] = "0"
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

_st_model = None
_st_load_attempted = False

def get_sentence_transformer():
    global _st_model, _st_load_attempted
    if _st_load_attempted:
        return _st_model
    _st_load_attempted = True
    try:
        from sentence_transformers import SentenceTransformer
        # Use lightweight, proven sentence embeddings model
        print("[AI Similarity] Initializing SentenceTransformer ('all-MiniLM-L6-v2')...")
        _st_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("[AI Similarity] SentenceTransformer initialized successfully.")
    except Exception as e:
        print(f"[AI Similarity] SentenceTransformer fallback to TF-IDF due to: {e}")
        _st_model = None
    return _st_model

def compute_similarity(query_text, candidate_grievances, threshold=0.40):
    """
    Computes cosine similarity between query_text and candidate grievances.
    Each candidate grievance is expected to have at least:
    { "id": "...", "trackingId": "...", "title": "...", "description": "...", "department": "...", "status": "..." }
    """
    if not candidate_grievances or not query_text or not query_text.strip():
        return []

    texts = [f"{g.get('title', '')} {g.get('description', '')}".strip() for g in candidate_grievances]
    st = get_sentence_transformer()

    scores = []
    method = "Sentence Transformers (all-MiniLM-L6-v2)"

    if st is not None:
        try:
            query_emb = st.encode([query_text], convert_to_numpy=True, show_progress_bar=False)
            candidate_embs = st.encode(texts, convert_to_numpy=True, show_progress_bar=False)
            sim_matrix = cosine_similarity(query_emb, candidate_embs)[0]
            scores = sim_matrix.tolist()
        except Exception as err:
            print(f"[AI Similarity] ST encode error: {err}. Using TF-IDF cosine similarity.")
            st = None

    if st is None:
        method = "TF-IDF + Cosine Similarity"
        tfidf = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
        all_corpus = [query_text] + texts
        matrix = tfidf.fit_transform(all_corpus)
        sim_matrix = cosine_similarity(matrix[0:1], matrix[1:])[0]
        scores = sim_matrix.tolist()

    results = []
    for idx, score in enumerate(scores):
        sc = round(float(score), 4)
        if sc >= threshold:
            cand = candidate_grievances[idx]
            results.append({
                "id": str(cand.get("id") or cand.get("_id") or ""),
                "trackingId": cand.get("trackingId", "N/A"),
                "title": cand.get("title", ""),
                "department": cand.get("department", "General"),
                "status": cand.get("status", "SUBMITTED"),
                "similarityScore": sc,
                "isDuplicate": bool(sc >= 0.75),
                "isSimilar": bool(sc >= 0.45),
                "method": method
            })

    results.sort(key=lambda x: x["similarityScore"], reverse=True)
    return results

if __name__ == "__main__":
    candidates = [
        {"id": "1", "trackingId": "EDU-2026-0001", "title": "Hostel WiFi not working", "description": "Internet connection in hostel block B is completely dead."},
        {"id": "2", "trackingId": "EDU-2026-0002", "title": "Mess food quality issue", "description": "The lunch served at mess was unhygienic and cold."},
        {"id": "3", "trackingId": "EDU-2026-0003", "title": "WiFi outage in hostel", "description": "No internet access on hostel Wi-Fi network since yesterday afternoon."}
    ]

    test_query = "Hostel wifi is down and no connectivity in block B"
    print(f"Testing similarity for query: '{test_query}'")
    matches = compute_similarity(test_query, candidates, threshold=0.35)
    print(f"Matches found: {len(matches)}")
    for m in matches:
        print(f" - {m['trackingId']} ({m['title']}): Score={m['similarityScore']} | Dup={m['isDuplicate']} | Method={m['method']}")
