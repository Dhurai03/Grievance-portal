const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', departmentController.getAll);
router.post('/', authenticateJWT, authorizeRoles('admin'), departmentController.create);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), departmentController.update);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), departmentController.remove);

module.exports = router;
