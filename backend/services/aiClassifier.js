/**
 * AI Grievance Classifier Service
 * Analyzing description text to suggest Category, Subcategory, Department, and Priority.
 * Designed modularly to make it easy to replace with a real LLM API (e.g. Gemini, OpenAI) later.
 */

// Heuristic keyword definitions for categorization
const RULES = [
  {
    category: 'Water Supply',
    subcategory: 'Water Pipe Leakage',
    department: 'Water Supply',
    priority: 'MEDIUM',
    keywords: ['leak', 'leaking', 'burst pipe', 'water overflow', 'water flow', 'pipe crack', 'pipe broken', 'valve'],
    boostKeywords: { 'burst': 'HIGH', 'flooding': 'HIGH', 'severe': 'HIGH' }
  },
  {
    category: 'Water Supply',
    subcategory: 'Dirty Water Supply',
    department: 'Water Supply',
    priority: 'HIGH',
    keywords: ['muddy', 'dirty water', 'bad smell', 'contaminated', 'drinking water', 'color', 'sewage smell', 'pollution'],
    boostKeywords: { 'illness': 'CRITICAL', 'poison': 'CRITICAL', 'sick': 'CRITICAL' }
  },
  {
    category: 'Electricity & Power',
    subcategory: 'Area Power Outage',
    department: 'Electricity',
    priority: 'MEDIUM',
    keywords: ['power cut', 'outage', 'blackout', 'no light', 'load shedding', 'electricity gone', 'voltage fluctuation'],
    boostKeywords: { 'hospital': 'CRITICAL', 'icu': 'CRITICAL' }
  },
  {
    category: 'Electricity & Power',
    subcategory: 'Dangerous Sparks or Hanging Wire',
    department: 'Electricity',
    priority: 'HIGH',
    keywords: ['hanging wire', 'sparking', 'spark', 'transformer fire', 'naked wire', 'short circuit', 'electric shock', 'danger wire'],
    boostKeywords: { 'fire': 'CRITICAL', 'blast': 'CRITICAL', 'fatal': 'CRITICAL' }
  },
  {
    category: 'Roads & Streets',
    subcategory: 'Potholes on Main Road',
    department: 'Roads & Infrastructure',
    priority: 'MEDIUM',
    keywords: ['pothole', 'potholes', 'crater', 'broken road', 'caved', 'asphalt', 'tar road', 'tarring'],
    boostKeywords: { 'accident': 'HIGH', 'injury': 'HIGH', 'damage': 'HIGH' }
  },
  {
    category: 'Roads & Streets',
    subcategory: 'Broken Streetlights',
    department: 'Roads & Infrastructure',
    priority: 'LOW',
    keywords: ['streetlight', 'street lights', 'dark street', 'bulb fused', 'lights off', 'darkness'],
    boostKeywords: { 'theft': 'MEDIUM', 'accident': 'MEDIUM' }
  },
  {
    category: 'Garbage & Waste',
    subcategory: 'Garbage Dump Overflow',
    department: 'Sanitation',
    priority: 'MEDIUM',
    keywords: ['garbage', 'trash', 'waste', 'dumpster', 'bin', 'overflowing', 'garbage truck', 'stink', 'litter'],
    boostKeywords: { 'disease': 'HIGH', 'infestation': 'HIGH' }
  },
  {
    category: 'Garbage & Waste',
    subcategory: 'Drain Clogging',
    department: 'Sanitation',
    priority: 'MEDIUM',
    keywords: ['drain', 'clogged', 'clogging', 'blocked drain', 'gutter', 'overflowing sewage', 'stagnant water', 'mosquitoes'],
    boostKeywords: { 'flooded': 'HIGH', 'drowning': 'CRITICAL' }
  }
];

/**
 * Heuristically classifies grievance text descriptions.
 * @param {string} text - The grievance description.
 * @returns {object} Suggestions for category, subcategory, department, priority.
 */
function classifyGrievance(text) {
  if (!text || typeof text !== 'string') {
    return {
      category: 'Roads & Streets',
      subcategory: 'Potholes on Main Road',
      department: 'Roads & Infrastructure',
      priority: 'MEDIUM',
      confidence: 0.1
    };
  }

  const cleanText = text.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    
    // Match keywords
    rule.keywords.forEach(kw => {
      if (cleanText.includes(kw)) {
        score += 2; // Base match score
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  // Fallback to default if no keywords matched
  if (!bestMatch || highestScore === 0) {
    return {
      category: 'Roads & Streets',
      subcategory: 'Potholes on Main Road',
      department: 'Roads & Infrastructure',
      priority: 'MEDIUM',
      confidence: 0.2
    };
  }

  // Determine priority (with boost keywords check)
  let priority = bestMatch.priority;
  if (bestMatch.boostKeywords) {
    for (const [kw, boostVal] of Object.entries(bestMatch.boostKeywords)) {
      if (cleanText.includes(kw)) {
        priority = boostVal; // Escalate priority
        break;
      }
    }
  }

  // Calculate confidence ratio
  const confidence = Math.min(0.9, 0.3 + (highestScore * 0.15));

  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    department: bestMatch.department,
    priority,
    confidence
  };
}

module.exports = {
  classifyGrievance
};
