const express = require('express');
const router = express.Router();
const { classifyWithGemini, chatWithGemini } = require('../services/geminiService');
const { optionalAuth } = require('../middleware/authMiddleware');
const Department = require('../models/Department');

// 1. Post to classify text description
router.post('/classify', optionalAuth, async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description text is required for AI classification.' });
  }

  try {
    const suggestions = await classifyWithGemini(description);
    
    // Fetch matching department from MongoDB
    const dept = await Department.findOne({
      $or: [
        { name: new RegExp(suggestions.department, 'i') },
        { code: suggestions.departmentCode || '' }
      ]
    });
    
    res.json({
      ...suggestions,
      departmentId: dept ? dept._id : null,
      departmentCode: dept ? dept.code : suggestions.departmentCode
    });
  } catch (error) {
    console.error('AI classification route error:', error);
    res.json({
      category: 'Academic Affairs',
      subcategory: 'Examination Issues',
      department: 'Academic Affairs',
      priority: 'MEDIUM',
      confidence: 0.5,
      departmentId: null
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

module.exports = router;
