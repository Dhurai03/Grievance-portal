const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const grievanceController = require('../controllers/grievanceController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// Configure Multer Storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File type validation list
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime'
];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, Word DOCs, and MP4/MOV videos are allowed.'));
    }
  }
});

// Routes
router.get('/', authenticateJWT, grievanceController.list);
router.post('/', authenticateJWT, authorizeRoles('citizen'), grievanceController.submit);
router.get('/:id', authenticateJWT, grievanceController.getById);

router.patch('/:id/status', authenticateJWT, grievanceController.updateStatus);
router.post('/:id/comments', authenticateJWT, grievanceController.addComment);
router.post('/:id/feedback', authenticateJWT, authorizeRoles('citizen'), grievanceController.submitFeedback);

router.post('/:id/assign', authenticateJWT, authorizeRoles('admin', 'officer'), grievanceController.assign);
router.post('/:id/escalate', authenticateJWT, authorizeRoles('officer'), grievanceController.escalate);

// Evidence attachment upload route
router.post('/:id/attachments', authenticateJWT, upload.array('evidence', 5), grievanceController.uploadAttachments);

// Error handler for Multer upload issues
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size allowed is 20MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
