const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const gc = require('../controllers/grievanceController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// Multer config
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('Invalid file type.'));
  }
});

// Public
router.get('/track/:trackingId', gc.trackGrievance);

// Authenticated
router.post('/', authenticateJWT, upload.array('attachments', 5), gc.submitGrievance);
router.get('/', authenticateJWT, gc.getGrievances);
router.get('/:id', authenticateJWT, gc.getGrievanceById);
router.post('/:id/comments', authenticateJWT, gc.addComment);
router.post('/:id/feedback', authenticateJWT, authorizeRoles('student'), gc.submitFeedback);

// Officer/Admin
router.patch('/:id/status', authenticateJWT, authorizeRoles('officer', 'admin', 'dean', 'faculty'), gc.updateStatus);
router.patch('/:id/assign', authenticateJWT, authorizeRoles('admin', 'dean'), gc.assignGrievance);

// SLA Monitoring & Escalation Audit
router.post('/audit-sla', authenticateJWT, authorizeRoles('admin', 'dean', 'officer'), gc.auditSlaBreaches);

// AI classification preview
router.post('/ai-classify', authenticateJWT, gc.aiClassify);

module.exports = router;
