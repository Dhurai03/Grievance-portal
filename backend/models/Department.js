const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  contactEmail: { type: String, lowercase: true, trim: true },
  contactPhone: { type: String, trim: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // SLA in hours for each priority
  slaConfig: {
    LOW: { type: Number, default: 168 },      // 7 days
    MEDIUM: { type: Number, default: 72 },    // 3 days
    HIGH: { type: Number, default: 48 },      // 2 days
    CRITICAL: { type: Number, default: 24 },  // 1 day
  },
  isActive: { type: Boolean, default: true },
  totalGrievances: { type: Number, default: 0 },
  resolvedGrievances: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
