/**
 * AI Grievance Classification & Analytics Engine for EduGrieve
 *
 * Implements:
 * 1. Core AI: NLP-based Department & Category Classification (TF-IDF + Logistic Regression)
 * 2. Recommended AI: Duplicate & Similar Grievance Detection (Sentence Transformers + Cosine Similarity)
 * 3. Recommended AI: Complaint Severity & Urgency Detection (Separate Supervised Text Classifier)
 * Plus smart heuristic fallbacks if microservice is offline.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

// College department routing rules (Keyword-based heuristic fallback)
const COLLEGE_RULES = [
  {
    category: 'Academic Affairs',
    subcategory: 'Examination Issues',
    department: 'Academic Affairs',
    departmentCode: 'ACAD',
    priority: 'HIGH',
    keywords: ['exam', 'examination', 'result', 'marks', 'grade', 'grade correction', 'hall ticket', 'revaluation', 'supplementary', 'backlog', 'attendance', 'internals', 'semester', 'answer sheet', 'malpractice'],
    boostKeywords: { 'urgent': 'CRITICAL', 'wrong result': 'CRITICAL', 'fail': 'HIGH' }
  },
  {
    category: 'Academic Affairs',
    subcategory: 'Course & Curriculum',
    department: 'Academic Affairs',
    departmentCode: 'ACAD',
    priority: 'MEDIUM',
    keywords: ['course', 'syllabus', 'curriculum', 'assignment', 'project', 'lab', 'practical', 'elective', 'subject', 'lecture', 'timetable', 'schedule'],
    boostKeywords: {}
  },
  {
    category: 'Hostel & Accommodation',
    subcategory: 'Room & Facilities',
    department: 'Hostel & Accommodation',
    departmentCode: 'HSTL',
    priority: 'MEDIUM',
    keywords: ['hostel', 'room', 'accommodation', 'mess', 'warden', 'dormitory', 'bed', 'mattress', 'bathroom', 'toilet', 'water supply', 'electricity hostel', 'wifi hostel', 'curfew'],
    boostKeywords: { 'unsafe': 'CRITICAL', 'harassment': 'CRITICAL', 'violence': 'CRITICAL' }
  },
  {
    category: 'Hostel & Accommodation',
    subcategory: 'Mess & Food',
    department: 'Hostel & Accommodation',
    departmentCode: 'HSTL',
    priority: 'MEDIUM',
    keywords: ['mess food', 'canteen', 'food quality', 'food hygiene', 'stale food', 'mess menu', 'meal'],
    boostKeywords: { 'food poisoning': 'CRITICAL', 'sick': 'HIGH', 'illness': 'HIGH' }
  },
  {
    category: 'Library',
    subcategory: 'Book & Resource Access',
    department: 'Library',
    departmentCode: 'LIB',
    priority: 'LOW',
    keywords: ['library', 'book', 'journal', 'resource', 'reading room', 'librarian', 'due date', 'fine', 'reference', 'database', 'e-library', 'borrow', 'return'],
    boostKeywords: {}
  },
  {
    category: 'IT & Technical Support',
    subcategory: 'Network & Connectivity',
    department: 'IT & Technical Support',
    departmentCode: 'IT',
    priority: 'MEDIUM',
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'connectivity', 'slow internet', 'portal', 'website', 'server', 'computer', 'lab computer', 'pc', 'software', 'login', 'password reset', 'email account', 'lan', 'hotspot'],
    boostKeywords: { 'exam portal': 'HIGH', 'server down': 'HIGH' }
  },
  {
    category: 'Finance & Fees',
    subcategory: 'Fee Payment & Receipts',
    department: 'Finance & Fees',
    departmentCode: 'FIN',
    priority: 'HIGH',
    keywords: ['fee', 'fees', 'payment', 'receipt', 'scholarship', 'refund', 'challan', 'tuition', 'hostel fee', 'bus fee', 'fine payment', 'concession', 'stipend', 'financial', 'bank'],
    boostKeywords: { 'urgent': 'CRITICAL', 'deadline': 'HIGH' }
  },
  {
    category: 'Student Welfare & Counseling',
    subcategory: 'Mental Health & Support',
    department: 'Student Welfare & Counseling',
    departmentCode: 'WELF',
    priority: 'HIGH',
    keywords: ['counseling', 'mental health', 'stress', 'anxiety', 'depression', 'harassment', 'bullying', 'discrimination', 'welfare', 'medical', 'health', 'safety', 'complaint', 'eve teasing'],
    boostKeywords: { 'suicide': 'CRITICAL', 'self harm': 'CRITICAL', 'violence': 'CRITICAL', 'assault': 'CRITICAL' }
  },
  {
    category: 'Sports & Extracurricular',
    subcategory: 'Facilities & Equipment',
    department: 'Sports & Extracurricular',
    departmentCode: 'SPRT',
    priority: 'LOW',
    keywords: ['sports', 'ground', 'gym', 'football', 'cricket', 'basketball', 'equipment', 'tournament', 'club', 'cultural', 'fest', 'event', 'playground'],
    boostKeywords: {}
  },
  {
    category: 'Transportation',
    subcategory: 'Bus Service',
    department: 'Transportation',
    departmentCode: 'TRNS',
    priority: 'MEDIUM',
    keywords: ['bus', 'transport', 'route', 'driver', 'vehicle', 'bus timing', 'bus pass', 'commute', 'pickup', 'drop'],
    boostKeywords: { 'accident': 'CRITICAL', 'unsafe driver': 'HIGH' }
  },
  {
    category: 'Canteen & Food Services',
    subcategory: 'Food Quality & Hygiene',
    department: 'Canteen & Food Services',
    departmentCode: 'CANT',
    priority: 'MEDIUM',
    keywords: ['canteen', 'cafeteria', 'food court', 'snacks', 'price', 'hygiene canteen', 'cleanliness canteen', 'vendor', 'stall'],
    boostKeywords: { 'food poisoning': 'HIGH', 'contaminated': 'HIGH' }
  },
  {
    category: 'Placement & Career Services',
    subcategory: 'Placement Process',
    department: 'Placement & Career Services',
    departmentCode: 'PLCMNT',
    priority: 'MEDIUM',
    keywords: ['placement', 'internship', 'job', 'campus recruitment', 'company', 'resume', 'interview', 'career', 'offer letter', 'hr', 'training', 'skill'],
    boostKeywords: {}
  },
  {
    category: 'Ragging & Discipline',
    subcategory: 'Anti-Ragging',
    department: 'Ragging & Discipline',
    departmentCode: 'DISC',
    priority: 'CRITICAL',
    keywords: ['ragging', 'rag', 'seniors', 'bully', 'bully by senior', 'abuse', 'threat', 'intimidation', 'force', 'humiliation', 'misbehavior', 'misconduct'],
    boostKeywords: { 'physical': 'CRITICAL', 'sexual': 'CRITICAL', 'mental torture': 'CRITICAL' }
  },
  // ─── Infrastructure & Safety Hazards ───────────────────────────────────────
  {
    category: 'Student Welfare & Counseling',
    subcategory: 'Campus Safety & Infrastructure',
    department: 'Student Welfare & Counseling',
    departmentCode: 'WELF',
    priority: 'CRITICAL',
    keywords: [
      'exposed wire', 'electrical wire', 'bare wire', 'live wire', 'electric shock',
      'short circuit', 'electrical hazard', 'power failure', 'switchboard', 'electrical fault',
      'gas leak', 'fire hazard', 'fire breakout', 'flooding', 'roof collapse', 'ceiling collapse',
      'broken glass', 'sharp object', 'unsafe building', 'cracked wall', 'structural damage',
      'chemical spill', 'toxic', 'fumes', 'hazard', 'unsafe', 'dangerous', 'emergency',
      'urgent repair', 'immediate danger', 'physical danger', 'injured', 'accident',
      'maintenance emergency', 'infrastructure', 'facility damage'
    ],
    boostKeywords: {
      'injure': 'CRITICAL',
      'injured': 'CRITICAL',
      'shock': 'CRITICAL',
      'fire': 'CRITICAL',
      'collapse': 'CRITICAL',
      'danger': 'CRITICAL',
      'emergency': 'CRITICAL',
      'immediate': 'CRITICAL',
      'hospital': 'CRITICAL'
    }
  }
];

/**
 * Fallback: Keyword-based NLP classification
 */
function classifyByKeywords(text) {
  if (!text || typeof text !== 'string') {
    return {
      category: 'Academic Affairs',
      subcategory: 'General',
      department: 'Academic Affairs',
      departmentCode: 'ACAD',
      priority: 'MEDIUM',
      confidence: 0.1,
      reasoning: 'No text provided; defaulted to Academic Affairs.',
      technique: 'Keyword NLP Fallback'
    };
  }

  const cleanText = text.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const rule of COLLEGE_RULES) {
    let score = 0;
    rule.keywords.forEach(kw => {
      if (cleanText.includes(kw)) score += 2;
    });
    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  if (!bestMatch || highestScore === 0) {
    return {
      category: 'Academic Affairs',
      subcategory: 'General Inquiry',
      department: 'Academic Affairs',
      departmentCode: 'ACAD',
      priority: 'MEDIUM',
      confidence: 0.25,
      reasoning: 'No specific keywords matched. Defaulted to Academic Affairs.',
      technique: 'Keyword NLP Fallback'
    };
  }

  let priority = bestMatch.priority;
  if (bestMatch.boostKeywords) {
    for (const [kw, boostVal] of Object.entries(bestMatch.boostKeywords)) {
      if (cleanText.includes(kw)) {
        priority = boostVal;
        break;
      }
    }
  }

  const confidence = Math.min(0.85, 0.35 + highestScore * 0.10);

  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    department: bestMatch.department,
    departmentCode: bestMatch.departmentCode,
    priority,
    confidence: Number(confidence.toFixed(2)),
    reasoning: `Matched ${Math.round(highestScore / 2)} keyword(s) in "${bestMatch.category}".`,
    technique: 'Keyword NLP Heuristics'
  };
}

/**
 * Fallback: Urgency estimation
 */
function estimateUrgencyFallback(text) {
  const clean = (text || '').toLowerCase();

  // ── CRITICAL: Physical safety, life-threatening, immediate danger ─────────
  const criticalPatterns = [
    'ragging', 'suicide', 'self harm', 'assault', 'violence', 'sexual',
    // Fire & electrical hazards
    'fire', 'electrical wire', 'exposed wire', 'bare wire', 'live wire', 'electric shock',
    'short circuit', 'electrical hazard', 'electrical fault', 'sparking', 'burning smell',
    // Structural / environmental
    'gas leak', 'roof collapse', 'ceiling collapse', 'wall crack', 'structural',
    'flooding', 'chemical spill', 'toxic fumes', 'hazardous',
    // Medical / injury
    'injured', 'injury', 'accident', 'hospital', 'unconscious', 'bleeding',
    // General safety
    'emergency', 'immediate danger', 'physical danger', 'life risk', 'unsafe building',
    'could be injured', 'someone could', 'people could', 'students could',
    'poison', 'poisoning', 'food poisoning'
  ];
  if (criticalPatterns.some(p => clean.includes(p))) {
    return {
      urgency: 'CRITICAL',
      confidence: 0.90,
      urgencyScore: 0.97,
      flagForImmediateReview: true,
      recommendedSlaHours: 24,
      technique: 'Rule-based Urgency Fallback'
    };
  }

  // ── HIGH: Urgent academic/financial deadlines, welfare issues ─────────────
  const highPatterns = [
    'deadline', 'hall ticket', 'revaluation', 'no water', 'harass', 'today',
    'no electricity', 'power cut', 'broken', 'dangerous', 'hazard',
    'urgent', 'immediately', 'asap', 'critical issue', 'not working for days',
    'exam tomorrow', 'submission today'
  ];
  if (highPatterns.some(p => clean.includes(p))) {
    return {
      urgency: 'HIGH',
      confidence: 0.78,
      urgencyScore: 0.80,
      flagForImmediateReview: true,
      recommendedSlaHours: 48,
      technique: 'Rule-based Urgency Fallback'
    };
  }

  // ── LOW: Suggestions, minor cosmetic/convenience requests ─────────────────
  const lowPatterns = [
    'suggest', 'suggestion', 'magazine', 'cricket', 'bean bag', 'plant',
    'font', 'colour', 'color', 'decoration', 'nice to have', 'minor'
  ];
  if (lowPatterns.some(p => clean.includes(p))) {
    return {
      urgency: 'LOW',
      confidence: 0.65,
      urgencyScore: 0.20,
      flagForImmediateReview: false,
      recommendedSlaHours: 120,
      technique: 'Rule-based Urgency Fallback'
    };
  }

  // ── MEDIUM: Default ───────────────────────────────────────────────────────
  return {
    urgency: 'MEDIUM',
    confidence: 0.60,
    urgencyScore: 0.50,
    flagForImmediateReview: false,
    recommendedSlaHours: 72,
    technique: 'Rule-based Urgency Fallback'
  };
}

/**
 * 1. Core AI: NLP-Based Department & Category Classification
 * Uses TF-IDF + Logistic Regression via AI Microservice
 */
async function classifyWithTFIDF(text) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${AI_SERVICE_URL}/api/ai/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        isAiRouted: true
      };
    }
  } catch (err) {
    console.warn('[AI Engine] TF-IDF classification microservice call failed, using heuristic fallback:', err.message);
  }

  const fallback = classifyByKeywords(text);
  return {
    ...fallback,
    isAiRouted: false
  };
}

/**
 * 2. Recommended AI: Complaint Severity and Urgency Detection
 * Uses separate supervised text classifier via AI Microservice
 */
async function detectSeverityAndUrgency(text) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${AI_SERVICE_URL}/api/ai/urgency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[AI Engine] Urgency classifier microservice call failed, using fallback:', err.message);
  }

  return estimateUrgencyFallback(text);
}

/**
 * 3. Recommended AI: Duplicate and Similar Grievance Detection
 * Uses Sentence Transformers + Cosine Similarity via AI Microservice
 */
async function findSimilarGrievances(queryText, candidateGrievances, threshold = 0.40) {
  if (!candidateGrievances || candidateGrievances.length === 0) {
    return { matches: [], totalMatches: 0, hasDuplicate: false, topMatch: null };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const formattedCandidates = candidateGrievances.map(g => ({
      id: String(g._id || g.id || ''),
      trackingId: g.trackingId || '',
      title: g.title || '',
      description: g.description || '',
      department: g.department?.name || (typeof g.department === 'string' ? g.department : 'General'),
      status: g.status || 'SUBMITTED'
    }));

    const res = await fetch(`${AI_SERVICE_URL}/api/ai/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryText,
        grievances: formattedCandidates,
        threshold
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[AI Engine] Sentence Transformers similarity call failed:', err.message);
  }

  // Token-overlap fallback
  const queryTokens = new Set(queryText.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const fallbackMatches = [];

  for (const cand of candidateGrievances) {
    const candTokens = new Set(`${cand.title} ${cand.description}`.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const intersection = [...queryTokens].filter(t => candTokens.has(t));
    const union = new Set([...queryTokens, ...candTokens]);
    const sim = union.size > 0 ? intersection.length / union.size : 0;

    if (sim >= 0.25) {
      fallbackMatches.push({
        id: String(cand._id || cand.id),
        trackingId: cand.trackingId,
        title: cand.title,
        similarityScore: Number(sim.toFixed(2)),
        isDuplicate: sim >= 0.60,
        isSimilar: sim >= 0.25,
        method: 'Token Jaccard Overlap Fallback'
      });
    }
  }

  fallbackMatches.sort((a, b) => b.similarityScore - a.similarityScore);
  return {
    matches: fallbackMatches,
    totalMatches: fallbackMatches.length,
    hasDuplicate: fallbackMatches.some(m => m.isDuplicate),
    topMatch: fallbackMatches[0] || null,
    technique: 'Token Jaccard Overlap Fallback'
  };
}

/**
 * Master classification function: Predicts department, category & urgency
 */
async function classifyGrievance(text) {
  const [deptResult, urgencyResult] = await Promise.all([
    classifyWithTFIDF(text),
    detectSeverityAndUrgency(text)
  ]);

  return {
    category: deptResult.category,
    subcategory: deptResult.subcategory,
    department: deptResult.department,
    departmentCode: deptResult.departmentCode,
    priority: urgencyResult.urgency || deptResult.priority || 'MEDIUM',
    confidence: deptResult.confidence,
    reasoning: `Predicted via ${deptResult.technique || 'TF-IDF'}. Urgency evaluated as ${urgencyResult.urgency} via ${urgencyResult.technique || 'Urgency Classifier'}.`,
    urgencyAnalysis: urgencyResult,
    isAiRouted: deptResult.isAiRouted,
    technique: deptResult.technique
  };
}

module.exports = {
  classifyGrievance,
  classifyWithTFIDF,
  detectSeverityAndUrgency,
  findSimilarGrievances,
  classifyByKeywords
};
