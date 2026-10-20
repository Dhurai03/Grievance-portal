const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { classifyGrievance, findSimilarGrievances } = require('../services/aiClassifier');

// Helper: create notification
async function createNotification(recipientId, type, title, message, grievanceId = null, link = null) {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, grievance: grievanceId, link });
  } catch (e) {
    console.error('[Notif] Error creating notification:', e.message);
  }
}

// Helper: compute SLA deadline
function computeSlaDeadline(priority, department) {
  const defaultHours = { CRITICAL: 24, HIGH: 48, MEDIUM: 72, LOW: 168 };
  const hours = department?.slaConfig?.[priority] || defaultHours[priority] || 72;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

// POST /api/grievances - Submit a new grievance
exports.submitGrievance = async (req, res) => {
  try {
    const { title, description, category, subcategory, isAnonymous, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const fullText = `${title} ${description}`.trim();

    // 1. AI Classification & Urgency (TF-IDF + Logistic Regression & Supervised Urgency Classifier)
    const aiResult = await classifyGrievance(fullText);

    // Find department from AI result or category
    const departmentName = aiResult.department;
    const dept = await Department.findOne({
      $or: [
        { name: new RegExp(departmentName, 'i') },
        { code: aiResult.departmentCode || '' }
      ]
    });

    // 2. Duplicate & Similar Grievance Detection (Sentence Transformers + Cosine Similarity)
    let similarityResult = { matches: [], totalMatches: 0, hasDuplicate: false };
    try {
      const candQuery = { status: { $nin: ['CLOSED', 'REJECTED'] } };
      if (dept) candQuery.department = dept._id;

      const candidates = await Grievance.find(candQuery)
        .select('_id trackingId title description department status')
        .limit(30)
        .lean();

      similarityResult = await findSimilarGrievances(fullText, candidates, 0.40);
    } catch (simErr) {
      console.warn('[Grievance] Duplicate check error during submission:', simErr.message);
    }

    // Handle file attachments
    const attachments = req.files?.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    })) || [];

    const urgencyData = aiResult.urgencyAnalysis || {};
    const priority = aiResult.priority || 'MEDIUM';

    const grievance = await Grievance.create({
      title,
      description,
      category: category || aiResult.category,
      subcategory: subcategory || aiResult.subcategory,
      department: dept?._id || null,
      submittedBy: req.user._id,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      priority,
      attachments,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      aiClassification: {
        ...aiResult,
        classifiedAt: new Date()
      },
      urgencyAnalysis: {
        urgency: urgencyData.urgency || priority,
        urgencyScore: urgencyData.urgencyScore || 0.5,
        confidence: urgencyData.confidence || aiResult.confidence || 0.7,
        flagForImmediateReview: urgencyData.flagForImmediateReview || ['HIGH', 'CRITICAL'].includes(priority),
        technique: urgencyData.technique || 'Supervised Urgency Classifier'
      },
      flaggedForStaffReview: urgencyData.flagForImmediateReview || ['HIGH', 'CRITICAL'].includes(priority),
      similarityAnalysis: {
        hasDuplicate: similarityResult.hasDuplicate,
        topMatchTrackingId: similarityResult.topMatch?.trackingId || null,
        topMatchScore: similarityResult.topMatch?.similarityScore || 0,
        similarCount: similarityResult.totalMatches,
        matches: (similarityResult.matches || []).slice(0, 3).map(m => ({
          trackingId: m.trackingId,
          title: m.title,
          similarityScore: m.similarityScore,
          isDuplicate: m.isDuplicate
        }))
      },
      isAiRouted: aiResult.isAiRouted,
      slaDeadline: computeSlaDeadline(priority, dept),
      history: [{
        previousStatus: null,
        newStatus: 'SUBMITTED',
        changedBy: req.user._id,
        remarks: similarityResult.hasDuplicate
          ? `Grievance submitted. Flagged: high similarity to existing ticket [${similarityResult.topMatch?.trackingId}].`
          : 'Grievance submitted successfully.'
      }]
    });

    // Increment dept total
    if (dept) {
      await Department.findByIdAndUpdate(dept._id, { $inc: { totalGrievances: 1 } });
    }

    // Audit log
    await AuditLog.create({
      action: 'GRIEVANCE_SUBMITTED',
      performedBy: req.user._id,
      targetEntity: 'grievance',
      targetId: grievance._id,
      metadata: {
        trackingId: grievance.trackingId,
        department: departmentName,
        urgency: priority,
        hasDuplicate: similarityResult.hasDuplicate
      }
    });

    // Notify student
    await createNotification(
      req.user._id,
      'GRIEVANCE_SUBMITTED',
      '✅ Grievance Submitted',
      `Your grievance "${title}" has been registered. Tracking ID: ${grievance.trackingId}${similarityResult.hasDuplicate ? ' (Related active complaint recognized by AI)' : ''}`,
      grievance._id,
      `#grievance/detail/${grievance._id}`
    );

    // Notify department officers
    if (dept?.officers?.length > 0) {
      for (const officerId of dept.officers) {
        await createNotification(
          officerId,
          'GRIEVANCE_ASSIGNED',
          '📋 New Grievance in Your Department',
          `A new ${priority} priority grievance has been submitted: "${title}"${similarityResult.hasDuplicate ? ' (⚠️ AI Duplicate Flag)' : ''}`,
          grievance._id,
          `#officer/grievance/${grievance._id}`
        );
      }
    }

    const populated = await Grievance.findById(grievance._id)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email studentId');

    res.status(201).json({
      message: 'Grievance submitted successfully!',
      grievance: populated,
      aiClassification: aiResult,
      similarity: similarityResult
    });
  } catch (error) {
    console.error('[Grievance] Submit error:', error);
    res.status(500).json({ error: 'Server error submitting grievance.' });
  }
};

// GET /api/grievances - List grievances (role-based)
exports.getGrievances = async (req, res) => {
  try {
    const { status, priority, department, category, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    const user = req.user;

    // Role-based filtering
    if (user.role === 'student') {
      query.submittedBy = user._id;
    } else if (user.role === 'officer' || user.role === 'faculty') {
      if (user.assignedDepartment) query.department = user.assignedDepartment._id;
    } else if (user.role === 'dean') {
      // Dean sees escalated + all
    }
    // admin sees all

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (department && ['admin', 'dean'].includes(user.role)) query.department = department;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { trackingId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [grievances, total] = await Promise.all([
      Grievance.find(query)
        .populate('department', 'name code')
        .populate('submittedBy', 'name email studentId department')
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Grievance.countDocuments(query)
    ]);

    res.json({
      grievances,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('[Grievance] List error:', error);
    res.status(500).json({ error: 'Server error fetching grievances.' });
  }
};

// GET /api/grievances/:id - Get grievance detail
exports.getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('department', 'name code contactEmail')
      .populate('submittedBy', 'name email studentId department year section')
      .populate('assignedTo', 'name email designation')
      .populate('history.changedBy', 'name role')
      .populate('comments.author', 'name role');

    if (!grievance) return res.status(404).json({ error: 'Grievance not found.' });

    const user = req.user;
    const isOwner = grievance.submittedBy._id.toString() === user._id.toString();
    const isOfficer = ['officer', 'faculty', 'admin', 'dean'].includes(user.role);

    if (!isOwner && !isOfficer) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Increment view count
    await Grievance.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Filter internal comments for students
    if (user.role === 'student') {
      grievance.comments = grievance.comments.filter(c => !c.isInternal);
    }

    res.json({ grievance });
  } catch (error) {
    console.error('[Grievance] Get by ID error:', error);
    res.status(500).json({ error: 'Server error fetching grievance.' });
  }
};

// GET /api/grievances/track/:trackingId - Public tracking
exports.trackGrievance = async (req, res) => {
  try {
    const grievance = await Grievance.findOne({ trackingId: req.params.trackingId.toUpperCase() })
      .populate('department', 'name code')
      .populate('assignedTo', 'name designation')
      .select('-comments -aiClassification -attachments');

    if (!grievance) return res.status(404).json({ error: 'Grievance not found with this tracking ID.' });

    res.json({ grievance });
  } catch (error) {
    res.status(500).json({ error: 'Server error tracking grievance.' });
  }
};

// PATCH /api/grievances/:id/status - Update status (officer/admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status, remarks, resolutionNote } = req.body;
    const validStatuses = ['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const grievance = await Grievance.findById(req.params.id).populate('submittedBy', 'name');
    if (!grievance) return res.status(404).json({ error: 'Grievance not found.' });

    const previousStatus = grievance.status;
    grievance.status = status;
    if (resolutionNote) grievance.resolutionNote = resolutionNote;
    if (status === 'RESOLVED') grievance.resolvedAt = new Date();
    if (status === 'CLOSED') grievance.closedAt = new Date();
    if (status === 'ESCALATED') {
      grievance.escalatedAt = new Date();
      grievance.escalatedBy = req.user._id;
      grievance.escalationReason = remarks;
    }

    grievance.history.push({
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      remarks: remarks || `Status changed to ${status}`
    });

    await grievance.save();

    // Update dept resolved count
    if (status === 'RESOLVED' && grievance.department) {
      await Department.findByIdAndUpdate(grievance.department, { $inc: { resolvedGrievances: 1 } });
    }

    // Notify student
    const statusMessages = {
      UNDER_REVIEW: 'Your grievance is now under review.',
      IN_PROGRESS: 'Your grievance is being actively worked on.',
      RESOLVED: `Your grievance has been resolved. ${resolutionNote ? 'Note: ' + resolutionNote : ''}`,
      CLOSED: 'Your grievance has been closed.',
      REJECTED: `Your grievance has been rejected. ${remarks ? 'Reason: ' + remarks : ''}`,
      ESCALATED: 'Your grievance has been escalated to senior management.'
    };

    await createNotification(
      grievance.submittedBy._id,
      'STATUS_CHANGED',
      `📬 Grievance Status Updated: ${status}`,
      statusMessages[status] || `Status updated to ${status}`,
      grievance._id,
      `#grievance/detail/${grievance._id}`
    );

    await AuditLog.create({
      action: 'GRIEVANCE_STATUS_UPDATED',
      performedBy: req.user._id,
      targetEntity: 'grievance',
      targetId: grievance._id,
      metadata: { previousStatus, newStatus: status, remarks }
    });

    res.json({ message: `Grievance status updated to ${status}.`, grievance });
  } catch (error) {
    console.error('[Grievance] Status update error:', error);
    res.status(500).json({ error: 'Server error updating status.' });
  }
};

// POST /api/grievances/:id/comments - Add comment
exports.addComment = async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required.' });

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) return res.status(404).json({ error: 'Grievance not found.' });

    const internal = isInternal && ['officer', 'admin', 'faculty', 'dean'].includes(req.user.role);

    grievance.comments.push({
      author: req.user._id,
      text: text.trim(),
      isInternal: internal
    });
    await grievance.save();

    // Notify if student commented → notify officer, and vice versa
    if (req.user.role === 'student') {
      if (grievance.assignedTo) {
        await createNotification(grievance.assignedTo, 'COMMENT_ADDED', '💬 New Comment', `Student added a comment on grievance ${grievance.trackingId}`, grievance._id);
      }
    } else {
      if (!internal) {
        await createNotification(grievance.submittedBy, 'COMMENT_ADDED', '💬 New Response', `An officer responded to your grievance ${grievance.trackingId}`, grievance._id, `#grievance/detail/${grievance._id}`);
      }
    }

    const updated = await Grievance.findById(req.params.id).populate('comments.author', 'name role');
    res.json({ message: 'Comment added.', comments: updated.comments });
  } catch (error) {
    console.error('[Grievance] Add comment error:', error);
    res.status(500).json({ error: 'Server error adding comment.' });
  }
};

// PATCH /api/grievances/:id/assign - Assign to officer
exports.assignGrievance = async (req, res) => {
  try {
    const { officerId } = req.body;
    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { assignedTo: officerId },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!grievance) return res.status(404).json({ error: 'Grievance not found.' });

    await createNotification(officerId, 'GRIEVANCE_ASSIGNED', '📋 Grievance Assigned to You', `Grievance ${grievance.trackingId} has been assigned to you.`, grievance._id, `#officer/grievance/${grievance._id}`);

    res.json({ message: 'Grievance assigned successfully.', grievance });
  } catch (error) {
    res.status(500).json({ error: 'Server error assigning grievance.' });
  }
};

// POST /api/grievances/:id/feedback - Submit feedback (student, after resolved)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) return res.status(404).json({ error: 'Grievance not found.' });
    if (grievance.submittedBy.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Access denied.' });
    if (grievance.status !== 'RESOLVED') return res.status(400).json({ error: 'Can only provide feedback on resolved grievances.' });

    grievance.feedback = { rating, comment, submittedAt: new Date() };
    grievance.status = 'CLOSED';
    grievance.closedAt = new Date();
    await grievance.save();

    res.json({ message: 'Feedback submitted. Thank you!', grievance });
  } catch (error) {
    res.status(500).json({ error: 'Server error submitting feedback.' });
  }
};

// POST /api/grievances/ai-classify - Classify text using AI (preview)
exports.aiClassify = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required for classification.' });
    const result = await classifyGrievance(text);
    res.json({ classification: result });
  } catch (error) {
    res.status(500).json({ error: 'AI classification failed.' });
  }
};

// POST /api/grievances/audit-sla - Run SLA check on demand & return breached/at-risk stats
exports.auditSlaBreaches = async (req, res) => {
  try {
    const User = require('../models/User');
    const now = new Date();

    // 1. Overdue and un-escalated
    const breached = await Grievance.find({
      status: { $nin: ['RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'] },
      slaDeadline: { $lt: now }
    }).populate('submittedBy', 'name email').populate('department', 'name code');

    const admins = await User.find({ role: { $in: ['admin', 'dean'] } }).select('_id');

    let newlyEscalated = 0;
    for (const g of breached) {
      g.status = 'ESCALATED';
      g.isSlaBreach = true;
      g.escalatedAt = now;
      g.escalationReason = 'Automated SLA Monitoring: Resolution deadline exceeded.';
      g.history.push({
        previousStatus: g.status,
        newStatus: 'ESCALATED',
        remarks: 'Auto-escalated by SLA Monitoring Engine due to expired resolution deadline.'
      });
      await g.save();
      newlyEscalated++;

      // Notify student
      if (g.submittedBy?._id) {
        await createNotification(
          g.submittedBy._id,
          'SLA_BREACH',
          '⚠️ Grievance Auto-Escalated',
          `Your grievance ${g.trackingId} exceeded the SLA resolution deadline and has been escalated to the Dean.`,
          g._id,
          `#grievance/detail/${g._id}`
        );
      }

      // Notify Admins
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'SLA_BREACH',
          '🚨 SLA Breach Alert',
          `Grievance ${g.trackingId} (${g.department?.name || 'Assigned'}) breached its SLA deadline and is escalated.`,
          g._id,
          `#admin/grievance/${g._id}`
        );
      }
    }

    // 2. Near breach: expiring within 6 hours
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const atRisk = await Grievance.find({
      status: { $nin: ['RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'] },
      slaDeadline: { $gte: now, $lte: sixHoursLater }
    }).select('trackingId title slaDeadline priority department').populate('department', 'name');

    // 3. Total escalated tickets
    const totalEscalated = await Grievance.countDocuments({ status: 'ESCALATED' });

    res.json({
      message: `SLA audit completed successfully. ${newlyEscalated} ticket(s) escalated.`,
      newlyEscalated,
      totalEscalated,
      atRiskCount: atRisk.length,
      atRisk
    });
  } catch (error) {
    console.error('[SLA Audit] Controller error:', error);
    res.status(500).json({ error: 'Server error during SLA audit.' });
  }
};
