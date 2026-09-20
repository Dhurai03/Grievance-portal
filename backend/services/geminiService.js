const { GoogleGenerativeAI } = require('@google/generative-ai');
const { classifyGrievance } = require('./aiClassifier');

const API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('[Gemini SDK] Live Google Gemini API client initialized.');
  } catch (error) {
    console.error('[Gemini SDK] Initialization error:', error);
  }
}

/**
 * Classifies grievance using Google Gemini model, falls back to keyword classifier if API key missing or fails.
 */
async function classifyWithGemini(description) {
  if (!genAI) {
    console.log('[Gemini SDK] Running local keyword classifier (GEMINI_API_KEY missing).');
    return classifyGrievance(description);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are a municipal grievance classifier. Your task is to analyze the grievance description provided by the citizen and map it to one of the configured categories, subcategories, departments, and priorities.

Available configurations:
1. Category: 'Water Supply'
   - Subcategory: 'Water Pipe Leakage' (Department: 'Water Supply', SLA: 3 days)
   - Subcategory: 'Dirty Water Supply' (Department: 'Water Supply', SLA: 2 days)
2. Category: 'Electricity & Power'
   - Subcategory: 'Area Power Outage' (Department: 'Electricity', SLA: 1 day)
   - Subcategory: 'Dangerous Sparks or Hanging Wire' (Department: 'Electricity', SLA: 1 day)
3. Category: 'Roads & Streets'
   - Subcategory: 'Potholes on Main Road' (Department: 'Roads & Infrastructure', SLA: 7 days)
   - Subcategory: 'Broken Streetlights' (Department: 'Roads & Infrastructure', SLA: 5 days)
4. Category: 'Garbage & Waste'
   - Subcategory: 'Garbage Dump Overflow' (Department: 'Sanitation', SLA: 2 days)
   - Subcategory: 'Drain Clogging' (Department: 'Sanitation', SLA: 3 days)

Rules for Priority:
- LOW: Minor issue or simple request.
- MEDIUM: Normal service disruption.
- HIGH: Major impact or safety concern.
- CRITICAL: Public emergency or immediate safety threat.

Analyze this grievance description: "${description}"

Return ONLY a valid JSON object matching this structure:
{
  "category": "category_name",
  "subcategory": "subcategory_name",
  "department": "department_name",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0 to 1.0
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Cleanup markdown formatting if model didn't follow JSON Mime type config strictly
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      category: parsed.category,
      subcategory: parsed.subcategory,
      department: parsed.department,
      priority: parsed.priority || 'MEDIUM',
      confidence: parsed.confidence || 0.8
    };
  } catch (error) {
    console.error('[Gemini SDK] Live Gemini Classification failed, falling back:', error);
    return classifyGrievance(description);
  }
}

/**
 * Handles conversational chat sessions using Gemini, falling back to local rule-based replies.
 */
async function chatWithGemini(userMessage, chatHistory = []) {
  if (!genAI) {
    return getLocalChatResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are the JanSuniye AI Civic Assistant. You help citizens write and summarize municipal grievances, identify responsible departments, explain municipal regulations, and track grievance statuses. Be polite, concise, and helpful. Do not speculate on confidential data.'
    });

    // Map frontend chat history format to Gemini Chat history format
    const contents = chatHistory.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }]
    }));

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('[Gemini SDK] Live Gemini Chat failed, falling back:', error);
    return `[System Connection Error] I am having trouble connecting to my live LLM model right now. \n\nFallback Assistant Response: Let's check your concern manually. Are you trying to file a complaint about Roads, Water Supply, Electricity, or Sanitation? Describe the issue and I can help route it!`;
  }
}

// Local conversational helper when GEMINI_API_KEY is not configured
function getLocalChatResponse(message) {
  const clean = message.toLowerCase();
  
  const greeting = "Hi there! I am the JanSuniye AI Civic Assistant. \n\n*(Note: To connect me to a live Google Gemini LLM, configure the GEMINI_API_KEY environment variable in your backend).* \n\n";

  if (clean.includes('hello') || clean.includes('hi') || clean.includes('hey')) {
    return greeting + "How can I help you draft, route, or track your grievances today? Ask me about potholes, power cuts, water leakage, or trash overflow!";
  }
  
  if (clean.includes('pothole') || clean.includes('road') || clean.includes('streetlight')) {
    return greeting + "I can help with that! It sounds like a **Roads & Streets** grievance. \n\nTo file it, click 'File a Grievance' in the sidebar and choose 'Roads & Streets' as the category. The SLA is typically 5 to 7 days, routed to the Roads & Infrastructure department.";
  }

  if (clean.includes('leak') || clean.includes('water') || clean.includes('dirty')) {
    return greeting + "That sounds like a **Water Supply** issue. \n\nIf the water is contaminated, choose 'Dirty Water Supply' (SLA: 2 Days). If it's a pipe break, choose 'Water Pipe Leakage' (SLA: 3 Days). Both are routed straight to the Water Supply department.";
  }

  if (clean.includes('power') || clean.includes('electricity') || clean.includes('spark') || clean.includes('outage')) {
    return greeting + "That sounds like an **Electricity & Power** issue. \n\nIf you see sparks or hanging wires, this is **Critical** and has a 24-hour resolution SLA. Please select 'Dangerous Sparks or Hanging Wire' on the submission form.";
  }

  if (clean.includes('garbage') || clean.includes('trash') || clean.includes('drain') || clean.includes('sewage')) {
    return greeting + "This is a **Garbage & Waste** grievance. \n\nIt will be routed to the Sanitation department. The resolution SLA is 2 days for garbage overflows and 3 days for drain clogging.";
  }

  if (clean.includes('track') || clean.includes('status')) {
    return greeting + "To track a grievance, enter the Grievance ID (e.g. `GRV-2026-000101`) in the tracking search bar or click 'Track Grievance' in the sidebar. You will see a live visual timeline of its resolution stage.";
  }

  return greeting + "I'm here to assist you! Describe your municipal issue (such as power outage, water leak, pothole, or garbage piling up), and I will explain how to file it, its expected SLA resolution timeline, and which department handles it.";
}

module.exports = {
  classifyWithGemini,
  chatWithGemini
};
