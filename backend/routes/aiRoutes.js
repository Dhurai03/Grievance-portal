const express = require('express');
const router = express.Router();
const { classifyWithGemini, chatWithGemini } = require('../services/geminiService');
const { optionalAuth } = require('../middleware/authMiddleware');

// 1. Post to classify text description
router.post('/classify', optionalAuth, async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description text is required for AI classification.' });
  }

  try {
    const suggestions = await classifyWithGemini(description);
    
    // Fetch mapped subcategory/department details from DB to return matching IDs
    const subcat = dbGetDetails(suggestions.subcategory, suggestions.category);
    
    res.json({
      ...suggestions,
      subcategoryId: subcat ? subcat.id : null,
      departmentId: subcat ? subcat.department_id : null
    });
  } catch (error) {
    console.error('AI classification route error:', error);
    res.json({
      category: 'Roads & Streets',
      subcategory: 'Potholes on Main Road',
      department: 'Roads & Infrastructure',
      priority: 'MEDIUM',
      confidence: 0.1,
      subcategoryId: 5, // Seeds Pothole subcat
      departmentId: 3   // Seeds Roads department
    });
  }
});

// 2. Post to hold chatbot conversations
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    const reply = await chatWithGemini(message, history || []);
    res.json({ reply });
  } catch (error) {
    console.error('AI chatbot route error:', error);
    res.status(500).json({ error: 'Server error processing chatbot query.' });
  }
});

// Helper to resolve subcategory name to database primary key IDs
function dbGetDetails(subName, catName) {
  try {
    const { db } = require('../config/db');
    return db.prepare(`
      SELECT s.id, s.department_id 
      FROM subcategories s
      JOIN categories c ON s.category_id = c.id
      WHERE s.name = ? OR s.name LIKE ?
      LIMIT 1
    `).get(subName, `%${subName}%`);
  } catch (err) {
    return null;
  }
}

module.exports = router;
