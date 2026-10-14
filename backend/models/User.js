const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'faculty', 'officer', 'admin', 'dean'],
    default: 'student'
  },
  // Student-specific fields
  studentId: { type: String, trim: true },
  department: { type: String, trim: true },
  year: { type: Number, min: 1, max: 5 },
  section: { type: String, trim: true },
  phone: { type: String, trim: true },
  // Officer/Faculty-specific fields
  designation: { type: String, trim: true },
  assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  // Status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  profilePicture: { type: String },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Sanitize output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
