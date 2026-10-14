/**
 * AI Grievance Classifier for College Grievance Portal
 * Uses Google Gemini API when key is available, falls back to keyword-based NLP.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// College department routing rules (keyword-based NLP fallback)
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
  {
    category: 'Faculty & Teaching Quality',
    subcategory: 'Teaching Standards',
    department: 'Academic Affairs',
    departmentCode: 'ACAD',
    priority: 'MEDIUM',
    keywords: ['faculty', 'professor', 'teacher', 'teaching', 'class', 'lecture quality', 'not teaching', 'absent faculty', 'partial', 'bias', 'favoritism'],
    boostKeywords: { 'harassment by faculty': 'CRITICAL', 'sexual harassment': 'CRITICAL' }
  }
];

/**
 * Keyword-based NLP classification (fallback)
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
      reasoning: 'No text provided; defaulted to Academic Affairs.'
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
      confidence: 0.2,
      reasoning: 'No specific keywords matched. Defaulted to Academic Affairs.'
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

  const confidence = Math.min(0.85, 0.3 + highestScore * 0.12);

  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    department: bestMatch.department,
    departmentCode: bestMatch.departmentCode,
    priority,
    confidence,
    reasoning: `Matched ${highestScore / 2} keyword(s) in the "${bestMatch.category}" category.`,
    model: 'keyword-nlp'
  };
}

/**
 * Gemini AI classification
 */
async function classifyWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI] No Gemini API key found. Using keyword-based fallback.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const departmentList = [
      'Academic Affairs (Code: ACAD)',
      'Hostel & Accommodation (Code: HSTL)',
      'Library (Code: LIB)',
      'IT & Technical Support (Code: IT)',
      'Finance & Fees (Code: FIN)',
      'Student Welfare & Counseling (Code: WELF)',
      'Sports & Extracurricular (Code: SPRT)',
      'Transportation (Code: TRNS)',
      'Canteen & Food Services (Code: CANT)',
      'Placement & Career Services (Code: PLCMNT)',
      'Ragging & Discipline (Code: DISC)',
    ];

    const prompt = `
You are an AI assistant for a college grievance management portal. Analyze the following student grievance and classify it.

Grievance Text: "${text}"

Available Departments:
${departmentList.join('\n')}

Respond ONLY with a valid JSON object (no markdown, no explanation) in this exact format:
{
  "category": "<main category>",
  "subcategory": "<specific subcategory>",
  "department": "<department name from the list above>",
  "departmentCode": "<code from the list above>",
  "priority": "<LOW | MEDIUM | HIGH | CRITICAL>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one sentence explaining the classification>"
}

Priority guide:
- CRITICAL: Immediate safety/health risk, ragging, harassment, financial emergency
- HIGH: Exam/result issues, fee deadlines, impactful academic concerns
- MEDIUM: General requests, service issues, routine complaints
- LOW: Minor inconveniences, suggestions, improvement requests
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON - handle markdown code blocks if present
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in Gemini response');

    const parsed = JSON.parse(jsonMatch[0]);
    parsed.model = 'gemini-1.5-flash';
    parsed.classifiedAt = new Date();
    return parsed;

  } catch (error) {
    console.error('[AI] Gemini classification error:', error.message);
    return null;
  }
}

/**
 * Main classify function - tries Gemini first, falls back to keywords
 */
async function classifyGrievance(text) {
  // Try Gemini AI first
  const geminiResult = await classifyWithGemini(text);
  if (geminiResult) {
    return { ...geminiResult, isAiRouted: true };
  }

  // Keyword fallback
  const keywordResult = classifyByKeywords(text);
  return { ...keywordResult, isAiRouted: false };
}

module.exports = { classifyGrievance, classifyByKeywords };
