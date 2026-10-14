const Grievance = require('../models/Grievance');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

// GET /api/analytics/overview (admin/dean)
exports.getOverview = async (req, res) => {
  try {
    const [
      totalGrievances,
      submitted,
      underReview,
      inProgress,
      resolved,
      closed,
      rejected,
      escalated,
      totalUsers,
      totalStudents,
      slaBreaches
    ] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'SUBMITTED' }),
      Grievance.countDocuments({ status: 'UNDER_REVIEW' }),
      Grievance.countDocuments({ status: 'IN_PROGRESS' }),
      Grievance.countDocuments({ status: 'RESOLVED' }),
      Grievance.countDocuments({ status: 'CLOSED' }),
      Grievance.countDocuments({ status: 'REJECTED' }),
      Grievance.countDocuments({ status: 'ESCALATED' }),
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Grievance.countDocuments({ isSlaBreach: true })
    ]);

    const resolutionRate = totalGrievances > 0
      ? Math.round(((resolved + closed) / totalGrievances) * 100)
      : 0;

    res.json({
      overview: {
        totalGrievances,
        byStatus: { submitted, underReview, inProgress, resolved, closed, rejected, escalated },
        totalUsers, totalStudents, slaBreaches, resolutionRate
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching analytics overview.' });
  }
};

// GET /api/analytics/by-department
exports.getByDepartment = async (req, res) => {
  try {
    const deptStats = await Grievance.aggregate([
      { $match: { department: { $ne: null } } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
          escalated: { $sum: { $cond: [{ $eq: ['$status', 'ESCALATED'] }, 1, 0] } },
          avgRating: { $avg: '$feedback.rating' }
        }
      },
      {
        $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } }
    ]);

    res.json({ deptStats });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching department stats.' });
  }
};

// GET /api/analytics/by-priority
exports.getByPriority = async (req, res) => {
  try {
    const priorityStats = await Grievance.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ priorityStats });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching priority stats.' });
  }
};

// GET /api/analytics/by-category
exports.getByCategory = async (req, res) => {
  try {
    const categoryStats = await Grievance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ categoryStats });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching category stats.' });
  }
};

// GET /api/analytics/monthly-trend
exports.getMonthlyTrend = async (req, res) => {
  try {
    const trend = await Grievance.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          submitted: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching monthly trend.' });
  }
};

// GET /api/analytics/audit-logs (admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audit logs.' });
  }
};

// GET /api/analytics/users (admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } }
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('assignedDepartment', 'name code')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({ users, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users.' });
  }
};

// PATCH /api/analytics/users/:id/role (admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role, assignedDepartment, designation } = req.body;
    const validRoles = ['student', 'faculty', 'officer', 'admin', 'dean'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, assignedDepartment: assignedDepartment || null, designation: designation || '' },
      { new: true }
    ).select('-password').populate('assignedDepartment', 'name code');

    if (!user) return res.status(404).json({ error: 'User not found.' });

    await AuditLog.create({
      action: 'USER_ROLE_UPDATED',
      performedBy: req.user._id,
      targetEntity: 'user',
      targetId: user._id,
      metadata: { newRole: role, designation }
    });

    res.json({ message: `User role updated to ${role}.`, user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user role.' });
  }
};
