const { db } = require('../config/db');

// Get all notifications for current user
function getAll(req, res) {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.user.id);

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Server error fetching notifications.' });
  }
}

// Mark notification as read
function markAsRead(req, res) {
  const { id } = req.params;

  try {
    const notif = db.prepare('SELECT id, user_id FROM notifications WHERE id = ?').get(id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notif.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized operation.' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Server error updating notification status.' });
  }
}

module.exports = {
  getAll,
  markAsRead
};
