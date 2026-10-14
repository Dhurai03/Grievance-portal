const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { classifyGrievance } = require('../services/aiClassifier');

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
  const hours = department?.slaConfig?.[priority] || 72;
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

    // AI Classification
    const aiResult = await classifyGrievance(description + ' ' + title);

    // Find department from AI result or category
    const departmentName = aiResult.department;
    const dept = await Department.findOne({ name: departmentName });

    // Handle file attachments
    const attachments = req.files?.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    })) || [];

    const grievance = await Grievance.create({
      title,
      description,
      category: category || aiResult.category,
      subcategory: subcategory || aiResult.subcategory,
      department: dept?._id || null,
      submittedBy: req.user._id,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      priority: aiResult.priority,
      attachments,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      aiClassification: {
        ...aiResult,
        classifiedAt: new Date()
      },
      isAiRouted: aiResult.isAiRouted,
      slaDeadline: computeSlaDeadline(aiResult.priority, dept),
      history: [{
        previousStatus: null,
        newStatus: 'SUBMITTED',
        changedBy: req.user._id,
        remarks: 'Grievance submitted successfully.'
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
      metadata: { trackingId: grievance.trackingId, department: departmentName }
    });

    // Notify student
    await createNotification(
      req.user._id,
      'GRIEVANCE_SUBMITTED',
      '✅ Grievance Submitted',
      `Your grievance "${title}" has been submitted successfully. Tracking ID: ${grievance.trackingId}`,
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
          `A new ${aiResult.priority} priority grievance has been submitted: "${title}"`,
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
      aiClassification: aiResult
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
