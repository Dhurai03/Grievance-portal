const express = require('express');
const router = express.Router();
const dc = require('../controllers/departmentController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, dc.getDepartments);
router.get('/:id', authenticateJWT, dc.getDepartmentById);
router.post('/', authenticateJWT, authorizeRoles('admin'), dc.createDepartment);
router.patch('/:id', authenticateJWT, authorizeRoles('admin'), dc.updateDepartment);
router.post('/:id/officers', authenticateJWT, authorizeRoles('admin'), dc.assignOfficer);

module.exports = router;
