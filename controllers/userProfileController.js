const UserProfile = require('../models/UserProfile');

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
      // Initialize minimal profile
      profile = new UserProfile({
        firebaseUID: uid,
        basicInfo: { fullName },
        contactInfo: { email }
      });

      return res.status(201).json({ 
        success: true,
        message: 'Profile initialized. Please complete steps.',
        data: null,
        isNewProfile: true,
        needsCompletion: true,
        nextStep: 1
      });
    }

    return res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
      isNewProfile: false
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ success: false, error: 'Server error', message: err.message });
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

console.log('✅ All UserProfile controller functions loaded successfully');
