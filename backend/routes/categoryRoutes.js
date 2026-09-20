const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', categoryController.getAll);
router.post('/', authenticateJWT, authorizeRoles('admin'), categoryController.createCategory);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), categoryController.deleteCategory);

router.post('/:categoryId/subcategories', authenticateJWT, authorizeRoles('admin'), categoryController.createSubcategory);
router.put('/subcategories/:id', authenticateJWT, authorizeRoles('admin'), categoryController.updateSubcategory);
router.delete('/subcategories/:id', authenticateJWT, authorizeRoles('admin'), categoryController.deleteSubcategory);

module.exports = router;
