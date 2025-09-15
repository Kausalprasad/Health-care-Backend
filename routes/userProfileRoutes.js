const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/userProfileController');

router.use(authMiddleware);

router.post('/profile', controller.createOrGetProfile);
router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

router.post('/profile/medical-condition', controller.addMedicalCondition);
router.post('/profile/allergy', controller.addAllergy);
router.post('/profile/medication', controller.addMedication);

module.exports = router;
