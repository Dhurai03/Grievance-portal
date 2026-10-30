const { GoogleGenerativeAI } = require('@google/generative-ai');

// Sanitize API key: strip accidental quotes, spaces, semicolons from .env
const rawKey = process.env.GEMINI_API_KEY || '';
const API_KEY = rawKey.replace(/["';\r\n\s]/g, '').trim();

let genAI = null;
if (API_KEY && API_KEY !== 'your_gemini_api_key_here' && API_KEY.length > 20) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('[Gemini SDK] Live Google Gemini API client initialized on backend.');
  } catch (error) {
    console.error('[Gemini SDK] Initialization error:', error.message);
  }
} else {
  console.warn('[Gemini SDK] No valid GEMINI_API_KEY found. Using local assistant fallback.');
}

/**
 * Model priority list - ordered by preference for this API key tier.
 * gemini-3.5-flash is the recommended stable model for new API keys (2026).
 */
const CHAT_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
const DRAFT_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

/**
 * Institutional System Prompt for EduGrieve AI Assistant
 */
function buildSystemInstruction(userContext = null) {
  let userGrievancesContext = 'No user is currently authenticated or no active grievances found.';

  if (userContext && userContext.user) {
    const studentInfo = `Student: ${userContext.user.name} (${userContext.user.studentId || userContext.user.email})`;
    const tickets = (userContext.grievances || []).map(g => {
      const deadlineStr = g.slaDeadline ? new Date(g.slaDeadline).toLocaleString() : 'N/A';
      return `- Tracking ID: ${g.trackingId} | Title: "${g.title}" | Status: ${g.status} | Priority: ${g.priority} | Dept: ${g.department?.name || 'Assigned'} | SLA Deadline: ${deadlineStr} | Breached: ${g.isSlaBreach ? 'YES' : 'NO'}${g.resolutionNote ? ' | Resolution: ' + g.resolutionNote : ''}`;
    }).join('\n');

    userGrievancesContext = `${studentInfo}\nActive Grievances:\n${tickets || 'None submitted yet.'}`;
  }

  return `You are EduGrieve AI, the official Campus Grievance Redressal Assistant for university students.

YOUR STRICT INSTITUTIONAL SCOPE & RESPONSIBILITIES:
1. HELP STUDENTS DRAFT CLEAR COMPLAINTS:
   - Help students articulate unstructured complaints clearly, objectively, and factually.
   - Advise them to include specific locations (hostel block, room, lab number, bus route), dates, times, and impact.
   - Suggest relevant evidence to attach (photos, receipts, hall tickets, mark sheets).
2. EXPLAIN CAMPUS POLICIES & SUBMISSION PROCESS:
   - Walk students through filing grievances, selecting departments, and utilizing confidential / 100% anonymous mode for anti-ragging.
   - Explain college SLA resolution timeframes (Critical: 24h, High: 48h, Medium: 72h, Low: 7 days).
3. FIND GRIEVANCE STATUS (AUTHENTICATED CONTEXT):
   - Below is the student's authenticated grievance record. When the student inquires about their complaint status, tracking number, or timeline, answer directly using this data:
=== AUTHENTICATED STUDENT GRIEVANCE DATA ===
${userGrievancesContext}
============================================
4. STRICT INSTITUTIONAL RESTRICTION:
   - Restrict your answers strictly to university grievance redressal, campus departments, college facilities, SLAs, anti-ragging policies, and student welfare.
   - If the user asks about unrelated topics (general coding, homework solutions, entertainment, sports trivia, off-campus politics), politely decline and redirect them back to university grievance assistance.
5. FORMATTING:
   - Always respond in friendly, professional, structured Markdown with bullet points and bold headers.`;
}

/**
 * Sanitize & format chat history for Gemini API.
 * Ensures turns alternate user/model and starts with 'user'.
 */
function sanitizeChatHistory(chatHistory = []) {
  const contents = [];
  let lastRole = null;

  for (const item of chatHistory) {
    if (!item || !item.content || !String(item.content).trim()) continue;
    const role = (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user';

    // Gemini requires the conversation to start with 'user'
    if (contents.length === 0 && role !== 'user') continue;

    // Merge consecutive same-role messages instead of erroring
    if (role === lastRole) {
      contents[contents.length - 1].parts[0].text += `\n${String(item.content).trim()}`;
    } else {
      contents.push({
        role,
        parts: [{ text: String(item.content).trim() }]
      });
      lastRole = role;
    }
  }

  return contents;
}

/**
 * Try a list of models in order, returning the first successful result.
 */
async function tryModels(modelNames, getModelConfig, callFn) {
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel(getModelConfig(modelName));
      const result = await callFn(model);
      console.log(`[Gemini SDK] Successfully used model: ${modelName}`);
      return result;
    } catch (error) {
      lastError = error;
      const is404 = error.message && (error.message.includes('404') || error.message.includes('not found') || error.message.includes('no longer available') || error.message.includes('not supported'));
      const is503 = error.message && (error.message.includes('503') || error.message.includes('Service Unavailable') || error.message.includes('high demand'));

      if (is404 || is503) {
        console.warn(`[Gemini SDK] ${modelName} unavailable (${is503 ? '503' : '404'}), trying next...`);
        continue;
      }
      // Non-availability error (auth, quota, etc.) — stop trying
      console.error(`[Gemini SDK] Non-retryable error on ${modelName}:`, error.message);
      break;
    }
  }

  throw lastError;
}

/**
 * Main conversational AI assistant using Gemini.
 * Falls back to local keyword-based assistant if all models fail.
 */
async function chatWithGemini(userMessage, chatHistory = [], userContext = null) {
  if (!genAI) {
    return getLocalChatResponse(userMessage, userContext);
  }

  const formattedHistory = sanitizeChatHistory(chatHistory).slice(-8);
  const contents = [
    ...formattedHistory,
    { role: 'user', parts: [{ text: String(userMessage).trim() }] }
  ];

  try {
    return await tryModels(
      CHAT_MODELS,
      (modelName) => ({
        model: modelName,
        systemInstruction: {
          role: 'system',
          parts: [{ text: buildSystemInstruction(userContext) }]
        }
      }),
      async (model) => {
        const result = await model.generateContent({ contents });
        return result.response.text();
      }
    );
  } catch (error) {
    console.warn('[Gemini SDK] All live models failed, using local assistant fallback. Last error:', error.message);
    return getLocalChatResponse(userMessage, userContext);
  }
}

/**
 * AI Grievance Drafting Assistant.
 * Takes rough notes and generates a structured, professional grievance submission.
 */
async function draftGrievanceWithGemini(rawNotes, categoryHint = '') {
  if (!rawNotes || !rawNotes.trim()) {
    return {
      suggestedTitle: '',
      structuredDescription: '',
      recommendedDepartment: 'Academic Affairs',
      recommendedPriority: 'MEDIUM',
      recommendedAttachments: []
    };
  }

  const prompt = `You are the EduGrieve Campus Grievance Drafting Specialist.
A college student has provided the following rough notes about a problem:
"${rawNotes}"
Category hint: "${categoryHint}"

Draft a formal, concise, and actionable grievance submission.
Return ONLY a valid JSON object matching this schema (no markdown, no code fences):
{
  "suggestedTitle": "Short, objective, clear title (max 12 words)",
  "structuredDescription": "Formal, well-structured description separating Facts, Timeline/Location, Academic/Living Impact, and Specific Resolution Requested.",
  "recommendedDepartment": "Academic Affairs | Hostel & Accommodation | IT & Technical Support | Finance & Fees | Library | Student Welfare & Counseling | Sports & Extracurricular | Transportation | Canteen & Food Services | Placement & Career Services | Ragging & Discipline",
  "recommendedPriority": "LOW | MEDIUM | HIGH | CRITICAL",
  "recommendedAttachments": ["List of 2-3 specific documents or photos the student should attach"]
}`;

  if (genAI) {
    try {
      return await tryModels(
        DRAFT_MODELS,
        (modelName) => ({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        }),
        async (model) => {
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim();
          // Strip any accidental markdown fences
          const cleaned = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
          return JSON.parse(cleaned);
        }
      );
    } catch (err) {
      console.warn('[Gemini SDK] Drafting assistant error, using local template:', err.message);
    }
  }

  // Local structured drafting template fallback
  const firstSentence = rawNotes.split(/[.\n]/)[0].trim().slice(0, 80);
  return {
    suggestedTitle: firstSentence || 'Grievance regarding campus service',
    structuredDescription: `**Summary of Incident:**\n${rawNotes.trim()}\n\n**Requested Action:**\nRequesting the concerned department authority to investigate and take corrective redressal action within college SLA norms.`,
    recommendedDepartment: categoryHint || 'Academic Affairs',
    recommendedPriority: 'MEDIUM',
    recommendedAttachments: ['Photo evidence / Screenshot', 'Student ID Card / Fee Receipt (if applicable)']
  };
}

/**
 * Intelligent Local Campus Assistant Fallback.
 * Used when Gemini API is unavailable or all models fail.
 */
function getLocalChatResponse(message, userContext = null) {
  const clean = (message || '').toLowerCase();
  const greeting = '🎓 **EduGrieve Campus AI Assistant**\n\n';

  // Grievance status tracking
  if (clean.includes('status') || clean.includes('track') || clean.includes('ticket') || clean.includes('my complaint') || clean.includes('my grievance') || clean.includes('edu-')) {
    if (userContext && userContext.grievances && userContext.grievances.length > 0) {
      let list = `Here are your recent authenticated grievances:\n\n`;
      userContext.grievances.slice(0, 4).forEach((g, idx) => {
        const timeRemaining = g.slaDeadline
          ? (new Date(g.slaDeadline) > new Date() ? '✅ Within SLA' : '⚠️ Overdue / Escalated')
          : 'N/A';
        list += `**${idx + 1}. [${g.trackingId}]** ${g.title}\n- **Status:** \`${g.status}\` | **Priority:** ${g.priority}\n- **SLA Status:** ${timeRemaining}\n${g.resolutionNote ? `- **Resolution:** ${g.resolutionNote}\n` : ''}\n`;
      });
      list += `\nYou can click on any ticket in your **Student Dashboard** to see full officer comments and timeline.`;
      return greeting + list;
    }
    return greeting + "🔍 **Grievance Status Tracking**\n\nTo view real-time status of your complaint:\n- **If logged in:** Head to your **Student Dashboard** or mention your tracking ID (e.g., `EDU-2026-00001`).\n- **If anonymous or logged out:** Click **Track Grievance** in the top navigation bar and enter your tracking code!";
  }

  // Drafting help
  if (clean.includes('draft') || clean.includes('how to write') || clean.includes('help me write') || clean.includes('format')) {
    return greeting + "✍️ **Tips for Drafting an Effective Grievance**\n\n1. **Clear Title:** Specify the exact issue and location (e.g., *'WiFi connectivity failure in CS Lab 2'*).\n2. **Factual Timeline:** Mention when the problem started and how many students are affected.\n3. **Objective Tone:** Focus on facts and impact on coursework or daily campus living.\n4. **Attach Evidence:** Upload photos of maintenance issues, fee receipts, or hall ticket screenshots.\n\n*Tip:* Use the **AI Draft Assistant** button in the **Submit Grievance** wizard to automatically polish your notes!";
  }

  // Academic / Exam
  if (clean.includes('exam') || clean.includes('result') || clean.includes('grade') || clean.includes('marks') || clean.includes('hall ticket') || clean.includes('attendance')) {
    return greeting + "📚 **Academic Affairs Issue Detected**\n\n- **Department:** Academic Affairs (ACAD)\n- **Standard SLA:** 48 hours for urgent exam issues, 72 hours for evaluations.\n- **Action:** Head to **Submit Grievance** → Describe your concern. Our AI will automatically flag urgent hall ticket/result discrepancies for high-priority review.";
  }

  // Hostel / Room
  if (clean.includes('hostel') || clean.includes('room') || clean.includes('warden') || clean.includes('mess') || clean.includes('dormitory')) {
    return greeting + "🏢 **Hostel & Accommodation Concern**\n\n- **Department:** Hostel & Accommodation (HSTL)\n- **SLA:** 24 - 48 hours for maintenance and sanitation, 12 hours for urgent facility breakdowns.\n- **Tip:** You can upload photos of room maintenance or mess conditions during submission.";
  }

  // IT / WiFi
  if (clean.includes('wifi') || clean.includes('internet') || clean.includes('login') || clean.includes('portal') || clean.includes('lab') || clean.includes('network')) {
    return greeting + "💻 **IT & Technical Support**\n\n- **Department:** IT & Technical Support (IT)\n- **SLA:** 24 hours for network disruptions and system credentials.\n- **Tip:** Mention your lab location, room number, or student roll number for rapid resolution.";
  }

  // Finance / Fees
  if (clean.includes('fee') || clean.includes('receipt') || clean.includes('scholarship') || clean.includes('refund') || clean.includes('challan')) {
    return greeting + "💳 **Finance & Fee Redressal**\n\n- **Department:** Finance & Accounts (FIN)\n- **SLA:** 48 hours for fee confirmation and scholarship status.\n- **Tip:** Attach your transaction reference or challan copy for faster audit.";
  }

  // Transportation
  if (clean.includes('bus') || clean.includes('transport') || clean.includes('route') || clean.includes('driver')) {
    return greeting + "🚌 **Transportation Concern**\n\n- **Department:** Transportation (TRNS)\n- **SLA:** 72 hours for route issues, 24 hours for urgent safety concerns.\n- **Tip:** Mention your bus route number and pickup/drop location.";
  }

  // Anti-Ragging / Safety
  if (clean.includes('ragging') || clean.includes('bully') || clean.includes('threat') || clean.includes('harass') || clean.includes('unsafe')) {
    return greeting + "🚨 **Anti-Ragging & Disciplinary Protocol (Immediate Action)**\n\n- **Priority:** CRITICAL (24-Hour Dean Escalation SLA)\n- **Anonymous Filing:** You may submit 100% anonymously with your identity protected.\n- **Direct Emergency:** Anti-Ragging Cell & Dean's Office are automatically notified upon submission.";
  }

  // Default / Generic help
  return greeting + "I can assist you with campus issues across:\n\n- 📚 **Academic Affairs** (exams, grades, attendance)\n- 🏢 **Hostel & Mess** (room issues, food quality)\n- 💻 **Campus IT/WiFi** (network, login problems)\n- 💳 **Finance & Scholarships** (fees, refunds)\n- 🚌 **Transportation** (bus routes, timing)\n- 🤝 **Student Welfare** (counseling, anti-ragging)\n\nYou can ask me to help **draft a complaint**, check your **ticket status**, or explain college **SLA resolution timelines**.";
}

module.exports = {
  chatWithGemini,
  draftGrievanceWithGemini
};
