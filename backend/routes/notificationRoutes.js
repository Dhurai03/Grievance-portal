const express = require('express');
const router = express.Router();
const nc = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, nc.getNotifications);
router.patch('/mark-all-read', authenticateJWT, nc.markAllRead);
router.patch('/:id/read', authenticateJWT, nc.markRead);
router.delete('/:id', authenticateJWT, nc.deleteNotification);

module.exports = router;
