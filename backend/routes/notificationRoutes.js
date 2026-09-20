const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, notificationController.getAll);
router.patch('/:id/read', authenticateJWT, notificationController.markAsRead);

module.exports = router;
