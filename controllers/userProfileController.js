const UserProfile = require('../models/UserProfile');
const fs = require('fs');
const path = require('path');

// -------------------------
// 1️⃣ Create or Get Profile
// -------------------------
exports.createOrGetProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email || '';
    const fullName = req.user.name || req.user.displayName || 'User';

    let profile = await UserProfile.findByFirebaseUID(uid);

    if (!profile) {
      // CREATE and SAVE minimal profile in database
      profile = new UserProfile({
        firebaseUID: uid,
        basicInfo: { fullName },
        contactInfo: { email }
      });

      // SAVE TO DATABASE - ye missing tha!
      await profile.save();

      return res.status(201).json({ 
        success: true,
        message: 'Profile created successfully. Please complete remaining steps.',
        data: profile,  // profile data return kar rahe hain
        isNewProfile: true,
        needsCompletion: true,
        nextStep: 1,
        completionStatus: profile.profileCompletion
      });
    }

    // Check if profile is complete
    const isComplete = profile.profileCompletion.completionPercentage === 100;
    let nextStep = null;
    
    if (!profile.profileCompletion.step1Completed) {
      nextStep = 1;
    } else if (!profile.profileCompletion.step2Completed) {
      nextStep = 2;
    } else if (!profile.profileCompletion.step3Completed) {
      nextStep = 3;
    }

    return res.json({
      success: true,
      message: isComplete ? 'Profile is complete' : 'Profile found but incomplete',
      data: profile,
      isNewProfile: false,
      needsCompletion: !isComplete,
      nextStep: nextStep,
      completionStatus: profile.profileCompletion,
      isComplete: isComplete
    });

  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error', 
      message: err.message 
    });
  }
};

// -------------------------
// 2️⃣ Get Profile
// -------------------------
exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', message: 'Please create your profile first' });
    }

    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
};

// -------------------------
// 3️⃣ Update Profile
// -------------------------
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;

    const profile = await UserProfile.findOneAndUpdate({ firebaseUID: uid }, { $set: updates }, { new: true, runValidators: true });

    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    return res.json({ success: true, message: 'Profile updated successfully', data: profile });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
};

// -------------------------
// 4️⃣ Add Medical / Allergy / Medication
// -------------------------
exports.addMedicalCondition = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    await profile.addMedicalCondition(req.body);
    return res.json({ success: true, message: 'Medical condition added successfully', data: profile });
  } catch (err) {
    console.error('Add medical condition error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
};

exports.addAllergy = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    await profile.addAllergy(req.body);
    return res.json({ success: true, message: 'Allergy added successfully', data: profile });
  } catch (err) {
    console.error('Add allergy error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
};

exports.addMedication = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    await profile.addMedication(req.body);
    return res.json({ success: true, message: 'Medication added successfully', data: profile });
  } catch (err) {
    console.error('Add medication error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
};

// -------------------------
// 5️⃣ Step 1: Basic Info
// -------------------------
exports.createProfileStep1 = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fullName, dateOfBirth, gender, bloodGroup, primaryPhone, email, patientID } = req.body;

    if (!fullName || !dateOfBirth || !gender || !bloodGroup || !primaryPhone) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'fullName, dateOfBirth, gender, bloodGroup, primaryPhone are required' });
    }

    let profile = await UserProfile.findByFirebaseUID(uid);

    if (profile) {
      // Merge existing
      profile.basicInfo = {
        ...profile.basicInfo.toObject(),
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup,
        patientID: patientID || profile.basicInfo.patientID
      };
      profile.contactInfo = {
        ...profile.contactInfo.toObject(),
        primaryPhone,
        email: email || profile.contactInfo.email
      };
      await profile.save();
    } else {
      profile = new UserProfile({
        firebaseUID: uid,
        basicInfo: { fullName, dateOfBirth: new Date(dateOfBirth), gender, bloodGroup, patientID },
        contactInfo: { primaryPhone, email: email || req.user.email || '' }
      });
      await profile.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Step 1 completed successfully',
      data: profile,
      nextStep: 2,
      completionStatus: profile.profileCompletion
    });
  } catch (err) {
    console.error('Step 1 error:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }
    return res.status(500).json({ success: false, error: 'Server error', message: 'Unable to complete step 1' });
  }
};

// -------------------------
// 6️⃣ Step 2: Emergency Contact
// -------------------------
exports.createProfileStep2 = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, relationship, phoneNumber, enableSMS, enableCall } = req.body;

    if (!name || !relationship || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'name, relationship, phoneNumber are required' });
    }

    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found', message: 'Complete Step 1 first' });

    profile.emergencyContact = {
      ...profile.emergencyContact?.toObject(),
      name,
      relationship,
      phoneNumber,
      enableSMS: enableSMS !== undefined ? enableSMS : true,
      enableCall: enableCall !== undefined ? enableCall : true
    };

    await profile.save();

    return res.json({ success: true, message: 'Step 2 completed', data: profile, nextStep: 3, completionStatus: profile.profileCompletion });
  } catch (err) {
    console.error('Step 2 error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: 'Unable to complete step 2' });
  }
};

// -------------------------
// 7️⃣ Step 3: Medical Info
// -------------------------
exports.createProfileStep3 = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { medicalConditions = [], allergies = [], medications = [] } = req.body;

    // Fetch profile
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete previous steps first'
      });
    }

    // -------------------------
    // Map Medical Conditions
    // -------------------------
    profile.medicalConditions = medicalConditions?.map(condition => ({
      conditionName: condition.conditionName,
      isCustom: condition.isCustom || false,
      status: condition.status || 'Active',
      diagnosedDate: condition.diagnosedDate ? new Date(condition.diagnosedDate) : undefined,
      notes: condition.notes || ''
    })) || [];

    // -------------------------
    // Map Allergies
    // -------------------------
    profile.allergies = allergies?.map(allergy => ({
      allergenName: allergy.allergenName,
      severity: allergy.severity,
      reaction: allergy.reaction || '',
      isCustom: allergy.isCustom || false
    })) || [];

    // -------------------------
    // Map Medications
    // -------------------------
    profile.medications = medications?.map(medication => ({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      timing: medication.timing || [],
      startDate: medication.startDate ? new Date(medication.startDate) : undefined,
      endDate: medication.endDate ? new Date(medication.endDate) : undefined,
      isActive: medication.isActive !== undefined ? medication.isActive : true,
      notes: medication.notes || '',
      addedBy: 'Patient'
    })) || [];

    // Save profile
    await profile.save();

    return res.json({
      success: true,
      message: 'Profile completed successfully!',
      data: profile,
      isComplete: true,
      completionStatus: profile.profileCompletion
    });

  } catch (err) {
    console.error('Step 3 creation error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Unable to complete step 3'
    });
  }
};
exports.skipProfileStep3 = async (req, res) => {
  try {
    console.log('=== SKIP STEP3 CALLED ===');
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    
    console.log('Profile before skip:', profile?.profileCompletion);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    profile.profileCompletion.step3Completed = true;
    profile.profileCompletion.completionPercentage = 100;
    
    await profile.save();
    
    console.log('Profile after skip:', profile.profileCompletion);

    return res.json({
      success: true,
      message: 'Profile setup completed (Step 3 skipped)',
      data: profile,
      isComplete: true
    });
  } catch (err) {
    console.error('Skip Step 3 error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// -------------------------
// 8️⃣ Get Profile Status
// -------------------------
exports.getProfileStatus = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);

    if (!profile) {
      return res.json({ success: true, profileExists: false, nextStep: 1, completionStatus: { step1Completed: false, step2Completed: false, step3Completed: false, completionPercentage: 0 } });
    }

    let nextStep = 1;
    if (profile.profileCompletion.step1Completed && !profile.profileCompletion.step2Completed) nextStep = 2;
    else if (profile.profileCompletion.step2Completed && !profile.profileCompletion.step3Completed) nextStep = 3;
    else if (profile.profileCompletion.completionPercentage === 100) nextStep = null;

    return res.json({ success: true, profileExists: true, data: profile, nextStep, isComplete: profile.profileCompletion.completionPercentage === 100, completionStatus: profile.profileCompletion });
  } catch (err) {
    console.error('Profile status error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// -------------------------
// 9️⃣ View Profile
// -------------------------
exports.viewProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);

    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found', message: 'Please create your profile first' });

    return res.json({ success: true, data: profile, completionStatus: profile.profileCompletion });
  } catch (err) {
    console.error('View profile error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const uid = req.user.uid;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a profile photo'
      });
    }

    // Find user profile
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) {
      // Delete uploaded file if profile not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please create your profile first'
      });
    }

    // Delete old profile photo if exists
    if (profile.basicInfo.profilePhoto && profile.basicInfo.profilePhoto.filename) {
      const oldPhotoPath = path.join(__dirname, '../uploads/profile-photos', profile.basicInfo.profilePhoto.filename);
      if (fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
          console.log('Old profile photo deleted:', profile.basicInfo.profilePhoto.filename);
        } catch (err) {
          console.error('Error deleting old photo:', err);
        }
      }
    }

    // Update profile with new photo
    profile.basicInfo.profilePhoto = {
      url: `/api/profile/photo/${req.file.filename}`,
      filename: req.file.filename,
      uploadedAt: new Date()
    };

    await profile.save();

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: profile.basicInfo.profilePhoto
      }
    });

  } catch (err) {
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Profile photo upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Unable to upload profile photo'
    });
  }
};

// -------------------------
// 🔟 Delete Profile Photo
// -------------------------
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const uid = req.user.uid;

    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    if (!profile.basicInfo.profilePhoto || !profile.basicInfo.profilePhoto.filename) {
      return res.status(400).json({
        success: false,
        error: 'No profile photo found'
      });
    }

    // Delete file from filesystem
    const photoPath = path.join(__dirname, '../uploads/profile-photos', profile.basicInfo.profilePhoto.filename);
    if (fs.existsSync(photoPath)) {
      try {
        fs.unlinkSync(photoPath);
        console.log('Profile photo deleted:', profile.basicInfo.profilePhoto.filename);
      } catch (err) {
        console.error('Error deleting photo file:', err);
      }
    }

    // Remove photo from profile
    profile.basicInfo.profilePhoto = undefined;
    await profile.save();

    return res.json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (err) {
    console.error('Profile photo delete error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Unable to delete profile photo'
    });
  }
};

console.log('✅ Profile photo controller functions added successfully');

console.log('✅ All UserProfile controller functions loaded successfully');
