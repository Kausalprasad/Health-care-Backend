const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/userProfileController');

// -------------------------
// MULTER CONFIGURATION FOR PROFILE PHOTOS
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-photos';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user.uid;
    cb(null, `${userId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// -------------------------
// OLD ROUTES (Backward compatible)
// -------------------------
router.post('/profile', authMiddleware, controller.createOrGetProfile);
router.get('/profile', authMiddleware, controller.getProfile || controller.viewProfile);
router.put('/profile', authMiddleware, controller.updateProfile);
router.post('/profile/medical-condition', authMiddleware, controller.addMedicalCondition);
router.post('/profile/allergy', authMiddleware, controller.addAllergy);
router.post('/profile/medication', authMiddleware, controller.addMedication);
router.post('/profile/skip-step3', authMiddleware, controller.skipProfileStep3);

// -------------------------
// PROFILE PHOTO ROUTES
// -------------------------
router.post('/profile/photo', authMiddleware, upload.single('profilePhoto'), controller.uploadProfilePhoto);
router.delete('/profile/photo', authMiddleware, controller.deleteProfilePhoto);

// -------------------------
// NEW 3-STEP PROFILE ROUTES
// -------------------------
if (controller.createProfileStep1) router.post('/profile/step1', authMiddleware, controller.createProfileStep1);
if (controller.createProfileStep2) router.post('/profile/step2', authMiddleware, controller.createProfileStep2);
if (controller.createProfileStep3) router.post('/profile/step3', authMiddleware, controller.createProfileStep3);

// -------------------------
// PROFILE STATUS & VIEW
// -------------------------
if (controller.getProfileStatus) router.get('/profile/status', authMiddleware, controller.getProfileStatus);
if (controller.viewProfile) router.get('/profile/view', authMiddleware, controller.viewProfile);
router.delete('/profile/delete', authMiddleware, controller.deleteProfile);

// -------------------------
// SERVE UPLOADED IMAGES
// -------------------------
router.get('/profile/photo/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../uploads/profile-photos', filename);
  
  // Check if file exists
  if (fs.existsSync(filepath)) {
    res.sendFile(path.resolve(filepath));
  } else {
    res.status(404).json({ success: false, error: 'Image not found' });
  }
});

module.exports = router;