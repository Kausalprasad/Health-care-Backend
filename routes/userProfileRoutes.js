const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/userProfileController');

// Apply authentication to all routes
router.use(authMiddleware);

// -------------------------
// OLD ROUTES (Backward compatible)
// -------------------------
router.post('/profile', controller.createOrGetProfile);
router.get('/profile', controller.getProfile || controller.viewProfile); // fallback
router.put('/profile', controller.updateProfile);
router.post('/profile/medical-condition', controller.addMedicalCondition);
router.post('/profile/allergy', controller.addAllergy);
router.post('/profile/medication', controller.addMedication);

// -------------------------
// NEW 3-STEP PROFILE ROUTES
// -------------------------
if (controller.createProfileStep1) router.post('/profile/step1', controller.createProfileStep1);
if (controller.createProfileStep2) router.post('/profile/step2', controller.createProfileStep2);
if (controller.createProfileStep3) router.post('/profile/step3', controller.createProfileStep3);

// -------------------------
// PROFILE STATUS & VIEW
// -------------------------
if (controller.getProfileStatus) router.get('/profile/status', controller.getProfileStatus);
if (controller.viewProfile) router.get('/profile/view', controller.viewProfile);

module.exports = router;
