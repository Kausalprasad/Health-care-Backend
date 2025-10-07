const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { analyzeLab, getLabResults } = require('../controllers/labController');
const authMiddleware = require('../middlewares/authMiddleware');

// Upload & Analyze lab PDF/JPG
router.post('/analyze', authMiddleware, upload.single('file'), analyzeLab);

// Get all lab results for logged-in user
router.get('/results', authMiddleware, getLabResults);

module.exports = router;
