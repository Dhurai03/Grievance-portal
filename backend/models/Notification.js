const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grievance: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance' },
  type: {
    type: String,
    enum: [
      'GRIEVANCE_SUBMITTED', 'STATUS_CHANGED', 'COMMENT_ADDED',
      'GRIEVANCE_ASSIGNED', 'SLA_WARNING', 'SLA_BREACH',
      'GRIEVANCE_RESOLVED', 'GRIEVANCE_ESCALATED', 'FEEDBACK_REQUEST',
      'ANNOUNCEMENT', 'SYSTEM'
    ],
    default: 'SYSTEM'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String }, // Frontend deep-link
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
