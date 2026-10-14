const { GoogleGenerativeAI } = require('@google/generative-ai');
const { classifyGrievance } = require('./aiClassifier');

const API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('[Gemini SDK] Live Google Gemini API client initialized for College Grievance Portal.');
  } catch (error) {
    console.error('[Gemini SDK] Initialization error:', error);
  }
}

/**
 * Classifies grievance using Google Gemini model, falls back to keyword classifier if API key missing or fails.
 */
async function classifyWithGemini(description) {
  if (!genAI) {
    console.log('[Gemini SDK] Running local NLP classifier (GEMINI_API_KEY missing).');
    return classifyGrievance(description);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are an AI-enabled College Grievance Routing Engine for EduGrieve Campus Portal.
Analyze the student grievance description and map it to the correct department, category, subcategory, priority, and department code.

Available Departments & Categories:
1. Academic Affairs (Code: ACAD)
   - Examination Issues (exams, hall tickets, grades, revaluation, results)
   - Course & Curriculum (syllabus, electives, assignment schedule, lectures)
   - Faculty & Teaching Quality (teaching standards, class conduct)
2. Hostel & Accommodation (Code: HSTL)
   - Room & Facilities (hostel room, water supply, electricity, bed, warden)
   - Mess & Food (mess food quality, hygiene, mess timings)
3. Library (Code: LIB)
   - Book & Resource Access (book availability, journals, digital library, fines)
4. IT & Technical Support (Code: IT)
   - Network & Connectivity (campus WiFi, portal login, lab computer, email)
5. Finance & Fees (Code: FIN)
   - Fee Payment & Receipts (fee challan, tuition fee, scholarships, refunds)
6. Student Welfare & Counseling (Code: WELF)
   - Mental Health & Support (counseling, stress, wellness, medical emergency)
7. Sports & Extracurricular (Code: SPRT)
   - Facilities & Equipment (gym, grounds, sports equipment, cultural clubs)
8. Transportation (Code: TRNS)
   - Bus Service (college bus routes, timings, bus passes)
9. Canteen & Food Services (Code: CANT)
   - Food Quality & Hygiene (cafeteria hygiene, food prices, cleanliness)
10. Placement & Career Services (Code: PLCMNT)
   - Placement Process (internships, campus recruitment, interview drives)
11. Ragging & Discipline (Code: DISC)
   - Anti-Ragging (ragging, bullying, harassment, intimidation - ALWAYS CRITICAL priority)

Rules for Priority:
- LOW: Informational or minor convenience issues (library books, sports club).
- MEDIUM: Standard operational issues (wifi glitch, room fan issue, bus timing).
- HIGH: Time-sensitive or academic blocks (exam hall ticket missing, fee deadline, results).
- CRITICAL: Immediate safety, harassment, anti-ragging, medical emergencies.

Analyze this student grievance:
"${description}"

Return ONLY a valid JSON object matching this structure:
{
  "category": "string",
  "subcategory": "string",
  "department": "string",
  "departmentCode": "ACAD" | "HSTL" | "LIB" | "IT" | "FIN" | "WELF" | "SPRT" | "TRNS" | "CANT" | "PLCMNT" | "DISC",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0 to 1.0,
  "explanation": "Brief reasoning for this classification"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      category: parsed.category || 'Academic Affairs',
      subcategory: parsed.subcategory || 'General Academic',
      department: parsed.department || 'Academic Affairs',
      departmentCode: parsed.departmentCode || 'ACAD',
      priority: parsed.priority || 'MEDIUM',
      confidence: parsed.confidence || 0.85,
      explanation: parsed.explanation || 'AI evaluated against college grievance rules.',
      isAiRouted: true
    };
  } catch (error) {
    console.error('[Gemini SDK] Live Gemini Classification failed, falling back:', error);
    return classifyGrievance(description);
  }
}

/**
 * Handles conversational chat sessions using Gemini for campus grievance queries.
 */
async function chatWithGemini(userMessage, chatHistory = []) {
  if (!genAI) {
    return getLocalChatResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are EduGrieve AI, an empathetic and authoritative Campus Grievance Assistant for college students.
You assist students in:
1. Identifying which college department handles their complaint (Academic, Hostel, IT, Finance, Library, Placement, Anti-Ragging, etc.).
2. Explaining college SLA resolution timeframes (Critical: 24h, High: 48h, Medium: 72h, Low: 7 days).
3. Advising how to structure complaints with evidence, photos, and tracking numbers.
4. Explaining the confidential, anonymous submission feature.
5. Providing urgent emergency contacts for anti-ragging and mental health counseling.
Keep answers structured, concise, friendly, and formatted in clean Markdown.`
    });

    const contents = chatHistory.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('[Gemini SDK] Live Gemini Chat failed, falling back:', error);
    return getLocalChatResponse(userMessage);
  }
}

// Local college-oriented conversational helper when GEMINI_API_KEY is not configured
function getLocalChatResponse(message) {
  const clean = message.toLowerCase();
  
  const greeting = "🎓 **EduGrieve Campus AI Assistant**\n\n";

  if (clean.includes('hello') || clean.includes('hi') || clean.includes('hey')) {
    return greeting + "Hello! I am your Campus Grievance Assistant. I can help you draft complaints, automatically route issues to the correct department (Academic Affairs, Hostel, IT, Finance, Welfare), and explain college SLAs.\n\nWhat can I assist you with today?";
  }
  
  if (clean.includes('exam') || clean.includes('result') || clean.includes('grade') || clean.includes('marks') || clean.includes('hall ticket')) {
    return greeting + "📚 **Academic Affairs Issue Detected**\n\n- **Department:** Academic Affairs (ACAD)\n- **Typical SLA:** 48 hours for urgent exam issues, 72 hours for evaluations.\n- **Action:** Head to **Submit Grievance** → Select *Academic Affairs* or describe your concern. Our AI will automatically flag urgent hall ticket/result discrepancies for high-priority review.";
  }

  if (clean.includes('hostel') || clean.includes('room') || clean.includes('warden') || clean.includes('mess')) {
    return greeting + "🏢 **Hostel & Accommodation Concern**\n\n- **Department:** Hostel & Accommodation (HSTL)\n- **SLA:** 24 - 48 hours for maintenance and sanitation, 12 hours for urgent facility breakdowns.\n- **Tip:** You can upload photos of room maintenance or mess conditions during submission.";
  }

  if (clean.includes('wifi') || clean.includes('internet') || clean.includes('login') || clean.includes('portal') || clean.includes('lab')) {
    return greeting + "💻 **IT & Technical Support**\n\n- **Department:** IT & Technical Support (IT)\n- **SLA:** 24 hours for network disruptions and system credentials.\n- **Tip:** Mention your lab location, room number, or student roll number for rapid resolution.";
  }

  if (clean.includes('fee') || clean.includes('receipt') || clean.includes('scholarship') || clean.includes('refund')) {
    return greeting + "💳 **Finance & Fee Redressal**\n\n- **Department:** Finance & Accounts (FIN)\n- **SLA:** 48 hours for fee confirmation and scholarship status.\n- **Tip:** Attach your transaction reference or challan copy for faster audit.";
  }

  if (clean.includes('ragging') || clean.includes('bully') || clean.includes('threat') || clean.includes('harass')) {
    return greeting + "🚨 **Anti-Ragging & Disciplinary Protocol (Immediate Action)**\n\n- **Priority:** CRITICAL (24-Hour Dean Escalation SLA)\n- **Anonymous Filing:** You may submit 100% anonymously with your identity protected.\n- **Direct Emergency:** Anti-Ragging Cell & Dean's Office are automatically notified upon submission.";
  }

  if (clean.includes('track') || clean.includes('status')) {
    return greeting + "🔍 **Tracking Your Grievance**\n\nEvery submission generates a unique tracking code (e.g., `EDU-2026-XXXX`). You can click **Track Grievance** in the sidebar anytime without logging in to see the real-time status, assigned officer, and history timeline.";
  }

  return greeting + "I can assist you with campus issues across **Academic Affairs**, **Hostel & Mess**, **Campus IT/WiFi**, **Finance & Scholarships**, **Transportation**, or **Student Welfare**. \n\nFeel free to describe what's going on and I'll guide you on how to file it!";
}

module.exports = {
  classifyWithGemini,
  chatWithGemini
};
