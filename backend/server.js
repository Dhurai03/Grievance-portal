const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb, db } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

const { authenticateJWT, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists and serve it statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Connect API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Additional Admin Route: Get Users (needed for Admin Dashboard User Management)
app.get('/api/admin/users', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.phone, u.created_at,
             o.designation, d.name as department_name, o.id as officer_id
      FROM users u
      LEFT JOIN officers o ON u.id = o.user_id
      LEFT JOIN departments d ON o.department_id = d.id
      ORDER BY u.created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Server error fetching user list.' });
  }
});

// Additional Admin Route: Promote User to Officer or Update Role
app.patch('/api/admin/users/:id/role', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const { role, departmentId, designation } = req.body;

  if (!role || !['citizen', 'officer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Valid user role is required.' });
  }

  try {
    const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Begin Transaction manually in SQLite (sequential writes)
    db.exec('BEGIN TRANSACTION;');

    // Update user role
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    if (role === 'officer') {
      // Upsert into officers details
      const existingOfficer = db.prepare('SELECT id FROM officers WHERE user_id = ?').get(id);
      if (existingOfficer) {
        db.prepare('UPDATE officers SET department_id = ?, designation = ? WHERE user_id = ?')
          .run(departmentId || null, designation || null, id);
      } else {
        db.prepare('INSERT INTO officers (user_id, department_id, designation) VALUES (?, ?, ?)')
          .run(id, departmentId || null, designation || null);
      }
    } else {
      // If downgraded, remove officer details
      db.prepare('DELETE FROM officers WHERE user_id = ?').run(id);
    }

    db.exec('COMMIT;');

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'UPDATE_USER_ROLE', 'user', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ oldRole: user.role, newRole: role, departmentId }));

    res.json({ message: `User '${user.name}' role updated to ${role} successfully.` });
  } catch (error) {
    try { db.exec('ROLLBACK;'); } catch(_) {}
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error updating user role.' });
  }
});

// Additional Admin Route: Get Audit Logs (needed for Admin Dashboard Audit Trail)
app.get('/api/admin/audit-logs', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 200
    `).all();
    res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Server error fetching audit trail logs.' });
  }
});

// Automated SLA Checker logic
function checkSLABreaches() {
  console.log('[SLA Engine] Running automated SLA breach audit...');
  try {
    const nowStr = new Date().toISOString();
    
    // Find all active grievances that have passed their SLA deadline and are not resolved/closed/escalated
    const breachedGrievances = db.prepare(`
      SELECT g.id, g.title, g.status, g.citizen_id, g.assigned_officer_id, o.user_id as officer_user_id
      FROM grievances g
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      WHERE g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED') 
        AND g.sla_deadline < ?
    `).all(nowStr);

    if (breachedGrievances.length === 0) {
      console.log('[SLA Engine] 0 new SLA breaches detected.');
      return;
    }

    console.log(`[SLA Engine] Detected ${breachedGrievances.length} SLA breaches. Triggering escalations...`);

    const updateGrievance = db.prepare("UPDATE grievances SET status = 'ESCALATED', updated_at = ? WHERE id = ?");
    const insertHistory = db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, ?, 'ESCALATED', NULL, 'Automated SLA Breach: Escalated to Administration.', ?)
    `);
    const insertEscalation = db.prepare(`
      INSERT INTO escalations (grievance_id, escalated_from_officer_id, reason)
      VALUES (?, ?, 'Automated SLA breach: Resolution deadline exceeded.')
    `);
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, grievance_id, message)
      VALUES (?, ?, ?)
    `);
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, metadata)
      VALUES ('SLA_BREACH_ESCALATION', 'grievance', ?, ?)
    `);

    // Fetch all admin user ids to notify
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();

    breachedGrievances.forEach(grv => {
      // Update status
      updateGrievance.run(nowStr, grv.id);
      
      // Log history
      insertHistory.run(grv.id, grv.status, nowStr);
      
      // Log escalation
      insertEscalation.run(grv.id, grv.assigned_officer_id || null);

      // Audit Log
      insertAudit.run(grv.id, JSON.stringify({ previousStatus: grv.status }));

      // Notify citizen
      insertNotif.run(
        grv.citizen_id, 
        grv.id, 
        `Your grievance ${grv.id} has exceeded the expected SLA timeline. It has been automatically escalated to administration.`
      );

      // Notify assigned officer
      if (grv.officer_user_id) {
        insertNotif.run(
          grv.officer_user_id,
          grv.id,
          `WARNING: Grievance ${grv.id} assigned to you has breached its SLA deadline and is now ESCALATED.`
        );
      }

      // Notify admins
      admins.forEach(admin => {
        insertNotif.run(
          admin.id,
          grv.id,
          `SLA BREACH ALERT: Grievance ${grv.id} has breached its resolution SLA and has been escalated.`
        );
      });
    });

    console.log(`[SLA Engine] Finished processing breaches.`);
  } catch (error) {
    console.error('[SLA Engine] Error running SLA audit:', error);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Run SLA breach checker on startup, and schedule it hourly
app.listen(PORT, () => {
  console.log(`Grievance Redressal Backend API running on port ${PORT}`);
  
  // Verify database is initialized
  try {
    initDb();
    
    // Initial SLA Audit check
    checkSLABreaches();
    
    // Set Interval to check every 1 hour (3600000 ms)
    setInterval(checkSLABreaches, 3600000);
  } catch (error) {
    console.error('Database connection failed during server startup:', error);
  }
});
