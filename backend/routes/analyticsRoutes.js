const express = require('express');
const router = express.Router();
const ac = require('../controllers/analyticsController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

const adminOrDean = authorizeRoles('admin', 'dean');

router.get('/overview', authenticateJWT, adminOrDean, ac.getOverview);
router.get('/by-department', authenticateJWT, adminOrDean, ac.getByDepartment);
router.get('/by-priority', authenticateJWT, adminOrDean, ac.getByPriority);
router.get('/by-category', authenticateJWT, adminOrDean, ac.getByCategory);
router.get('/monthly-trend', authenticateJWT, adminOrDean, ac.getMonthlyTrend);
router.get('/audit-logs', authenticateJWT, authorizeRoles('admin'), ac.getAuditLogs);
router.get('/users', authenticateJWT, authorizeRoles('admin'), ac.getUsers);
router.patch('/users/:id/role', authenticateJWT, authorizeRoles('admin'), ac.updateUserRole);

module.exports = router;
