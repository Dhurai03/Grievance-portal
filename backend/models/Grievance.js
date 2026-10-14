const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isInternal: { type: Boolean, default: false }, // Internal officer notes vs student-visible
  attachments: [{ filename: String, originalName: String, mimetype: String }],
  createdAt: { type: Date, default: Date.now }
});

const historySchema = new mongoose.Schema({
  previousStatus: String,
  newStatus: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
  timestamp: { type: Date, default: Date.now }
});

const grievanceSchema = new mongoose.Schema({
  // Tracking ID
  trackingId: { type: String, unique: true },

  // Submitter
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Grievance details
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },

  // AI-classified / user-selected
  category: { type: String, required: true, trim: true },
  subcategory: { type: String, trim: true },

  // Routing
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // AI classification metadata
  aiClassification: {
    category: String,
    subcategory: String,
    department: String,
    departmentCode: String,
    priority: String,
    confidence: Number,
    reasoning: String,
    model: String,
    classifiedAt: Date
  },
  isAiRouted: { type: Boolean, default: false },

  // Status workflow
  status: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED', 'REOPENED'],
    default: 'SUBMITTED'
  },

  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },

  // SLA
  slaDeadline: { type: Date },
  isSlaBreach: { type: Boolean, default: false },

  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Resolution
  resolutionNote: { type: String, trim: true },
  resolvedAt: { type: Date },
  closedAt: { type: Date },

  // Feedback (after resolution)
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    submittedAt: Date
  },

  // Escalation
  escalationReason: { type: String, trim: true },
  escalatedAt: { type: Date },
  escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Visibility
  isAnonymous: { type: Boolean, default: false },

  // History
  history: [historySchema],
  comments: [commentSchema],

  // Tags
  tags: [{ type: String, trim: true }],

  // View count
  viewCount: { type: Number, default: 0 },

}, { timestamps: true });

// Auto-generate tracking ID
grievanceSchema.pre('save', async function (next) {
  if (!this.trackingId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Grievance').countDocuments();
    this.trackingId = `EDU-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index for quick lookups
grievanceSchema.index({ submittedBy: 1 });
grievanceSchema.index({ department: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Grievance', grievanceSchema);
