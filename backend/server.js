require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'College Grievance Portal API',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Automated SLA Breach Checker
const checkSLABreaches = async () => {
  try {
    const Grievance = require('./models/Grievance');
    const Notification = require('./models/Notification');
    const User = require('./models/User');

    const now = new Date();
    const breached = await Grievance.find({
      status: { $nin: ['RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED'] },
      slaDeadline: { $lt: now },
      isSlaBreach: false
    }).populate('submittedBy', '_id').populate('assignedTo', '_id');

    if (breached.length === 0) return;
    console.log(`[SLA Engine] ${breached.length} SLA breach(es) detected.`);

    const admins = await User.find({ role: { $in: ['admin', 'dean'] } }).select('_id');

    for (const g of breached) {
      g.status = 'ESCALATED';
      g.isSlaBreach = true;
      g.escalatedAt = now;
      g.escalationReason = 'Automated SLA breach: Resolution deadline exceeded.';
      g.history.push({ previousStatus: g.status, newStatus: 'ESCALATED', remarks: 'Auto-escalated due to SLA breach.' });
      await g.save();

      // Notify student
      await Notification.create({
        recipient: g.submittedBy._id,
        grievance: g._id,
        type: 'SLA_BREACH',
        title: '⚠️ Grievance Escalated',
        message: `Your grievance ${g.trackingId} has exceeded the SLA timeline and has been escalated.`,
        link: `#grievance/detail/${g._id}`
      });

      // Notify admins/dean
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          grievance: g._id,
          type: 'SLA_BREACH',
          title: '🚨 SLA Breach Alert',
          message: `Grievance ${g.trackingId} has breached its SLA and is now escalated.`,
        });
      }
    }
    console.log(`[SLA Engine] Processed ${breached.length} breach(es).`);
  } catch (err) {
    console.error('[SLA Engine] Error:', err.message);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('\n🎓 College Grievance Portal Backend');
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  // Initial + hourly SLA check
  setTimeout(checkSLABreaches, 5000);
  setInterval(checkSLABreaches, 60 * 60 * 1000);
};

startServer();
