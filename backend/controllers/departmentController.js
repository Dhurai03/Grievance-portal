const Department = require('../models/Department');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// GET /api/departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name email designation')
      .populate('officers', 'name email designation')
      .sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching departments.' });
  }
};

// GET /api/departments/:id
exports.getDepartmentById = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id)
      .populate('head', 'name email designation')
      .populate('officers', 'name email designation');
    if (!dept) return res.status(404).json({ error: 'Department not found.' });
    res.json({ department: dept });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching department.' });
  }
};

// POST /api/departments (admin only)
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, contactEmail, contactPhone, slaConfig } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code are required.' });

    const dept = await Department.create({ name, code, description, contactEmail, contactPhone, slaConfig });

    await AuditLog.create({
      action: 'DEPARTMENT_CREATED',
      performedBy: req.user._id,
      targetEntity: 'department',
      targetId: dept._id,
      metadata: { name, code }
    });

    res.status(201).json({ message: 'Department created.', department: dept });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Department with this name or code already exists.' });
    res.status(500).json({ error: 'Error creating department.' });
  }
};

// PATCH /api/departments/:id (admin only)
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description, contactEmail, contactPhone, slaConfig, isActive } = req.body;
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, contactEmail, contactPhone, slaConfig, isActive },
      { new: true, runValidators: true }
    );
    if (!dept) return res.status(404).json({ error: 'Department not found.' });
    res.json({ message: 'Department updated.', department: dept });
  } catch (error) {
    res.status(500).json({ error: 'Error updating department.' });
  }
};

// POST /api/departments/:id/officers - Assign officer to department
exports.assignOfficer = async (req, res) => {
  try {
    const { userId, isHead } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Update user's department assignment
    user.assignedDepartment = dept._id;
    if (!['officer', 'faculty', 'dean'].includes(user.role)) {
      user.role = 'officer';
    }
    await user.save({ validateBeforeSave: false });

    // Add to department officers
    if (!dept.officers.includes(userId)) {
      dept.officers.push(userId);
    }
    if (isHead) dept.head = userId;
    await dept.save();

    res.json({ message: `User assigned to ${dept.name} as ${isHead ? 'Head' : 'Officer'}.` });
  } catch (error) {
    res.status(500).json({ error: 'Error assigning officer.' });
  }
};
