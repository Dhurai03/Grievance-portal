const express = require('express');
const router = express.Router();
const {
  classifyWithTFIDF,
  detectSeverityAndUrgency,
  findSimilarGrievances,
  classifyGrievance
} = require('../services/aiClassifier');
const { chatWithGemini, draftGrievanceWithGemini } = require('../services/geminiService');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');
const Department = require('../models/Department');
const Grievance = require('../models/Grievance');

/**
 * 1. Core AI: NLP-Based Department & Category Classification
 * Technique: TF-IDF + Logistic Regression
 */
router.post('/classify', optionalAuth, async (req, res) => {
  const { description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description text is required for AI classification.' });
  }

  try {
    const classification = await classifyWithTFIDF(description);
    const urgency = await detectSeverityAndUrgency(description);

    // Fetch matching department from MongoDB
    const dept = await Department.findOne({
      $or: [
        { name: new RegExp(classification.department, 'i') },
        { code: classification.departmentCode || '' }
      ]
    });

    res.json({
      ...classification,
      urgency: urgency.urgency,
      urgencyScore: urgency.urgencyScore,
      flagForImmediateReview: urgency.flagForImmediateReview,
      departmentId: dept ? dept._id : null,
      departmentCode: dept ? dept.code : classification.departmentCode,
      slaHours: urgency.recommendedSlaHours || (dept?.slaConfig?.[urgency.urgency] || 72)
    });
  } catch (error) {
    console.error('[AI Route] Classification error:', error);
    res.status(500).json({ error: 'Error during AI department classification.' });
  }
});

/**
 * 2. Recommended AI: Duplicate and Similar Grievance Detection
 * Technique: Sentence Transformers + Cosine Similarity
 */
router.post('/check-duplicates', optionalAuth, async (req, res) => {
  const { title, description, departmentId, threshold = 0.40 } = req.body;
  const queryText = `${title || ''} ${description || ''}`.trim();

  if (!queryText) {
    return res.status(400).json({ error: 'Title or description is required for duplicate check.' });
  }

  try {
    // Fetch candidate complaints from database
    const query = { status: { $nin: ['CLOSED', 'REJECTED'] } };
    if (departmentId) {
      query.department = departmentId;
    }

    const candidates = await Grievance.find(query)
      .select('_id trackingId title description department status createdAt')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const similarityResult = await findSimilarGrievances(queryText, candidates, threshold);

    res.json(similarityResult);
  } catch (error) {
    console.error('[AI Route] Duplicate check error:', error);
    res.status(500).json({ error: 'Error checking duplicate grievances.' });
  }
});

/**
 * 3. Recommended AI: Complaint Severity and Urgency Detection
 * Technique: Supervised Text Classifier
 */
router.post('/urgency', optionalAuth, async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required for urgency estimation.' });
  }

  try {
    const urgency = await detectSeverityAndUrgency(text);
    res.json(urgency);
  } catch (error) {
    console.error('[AI Route] Urgency estimation error:', error);
    res.status(500).json({ error: 'Error during urgency detection.' });
  }
});

/**
 * 4. Generative AI: Drafting Assistant
 */
router.post('/draft', optionalAuth, async (req, res) => {
  const { notes, category } = req.body;

  if (!notes || !notes.trim()) {
    return res.status(400).json({ error: 'Rough notes are required for drafting.' });
  }

  try {
    const draft = await draftGrievanceWithGemini(notes, category);
    res.json(draft);
  } catch (error) {
    console.error('[AI Route] Draft error:', error);
    res.status(500).json({ error: 'Error drafting grievance with AI.' });
  }
});

/**
 * 4. Generative AI: AI Grievance Assistant Chatbot (with Auth Ticket Lookup)
 */
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, history } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    let userContext = null;

    // If authenticated user, fetch their recent grievances for status inquiries
    if (req.user) {
      const grievances = await Grievance.find({ submittedBy: req.user._id })
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      userContext = {
        user: {
          name: req.user.name,
          email: req.user.email,
          studentId: req.user.studentId,
          role: req.user.role
        },
        grievances
      };
    }

    const reply = await chatWithGemini(message, history || [], userContext);
    res.json({ reply, isAuthenticated: Boolean(req.user) });
  } catch (error) {
    console.error('[AI Route] Chatbot error:', error);
    res.status(500).json({ error: 'Server error processing chatbot query.' });
  }
});

/**
 * Full AI Suite: Classify, Urgency & Duplicate Check
 */
router.post('/analyze-full', optionalAuth, async (req, res) => {
  const { title, description, departmentId } = req.body;
  const fullText = `${title || ''} ${description || ''}`.trim();

  if (!fullText) {
    return res.status(400).json({ error: 'Title or description required.' });
  }

  try {
    const [classification, urgency] = await Promise.all([
      classifyWithTFIDF(fullText),
      detectSeverityAndUrgency(fullText)
    ]);

    // Query candidate grievances for similarity
    const candQuery = { status: { $nin: ['CLOSED', 'REJECTED'] } };
    if (departmentId) candQuery.department = departmentId;

    const candidates = await Grievance.find(candQuery)
      .select('_id trackingId title description department status')
      .populate('department', 'name')
      .limit(40)
      .lean();

    const similarity = await findSimilarGrievances(fullText, candidates, 0.40);

    const dept = await Department.findOne({
      $or: [
        { name: new RegExp(classification.department, 'i') },
        { code: classification.departmentCode || '' }
      ]
    });

    res.json({
      classification: {
        ...classification,
        departmentId: dept?._id || null
      },
      urgency,
      similarity
    });
  } catch (error) {
    console.error('[AI Route] Full analysis error:', error);
    res.status(500).json({ error: 'Error analyzing grievance.' });
  }
});

module.exports = router;
