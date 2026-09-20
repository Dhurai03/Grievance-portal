const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/admin', authenticateJWT, authorizeRoles('admin'), analyticsController.getAdminAnalytics);
router.get('/officer', authenticateJWT, authorizeRoles('officer'), analyticsController.getOfficerStats);
router.get('/citizen', authenticateJWT, analyticsController.getCitizenStats);

module.exports = router;
