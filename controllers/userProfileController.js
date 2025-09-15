const UserProfile = require('../models/UserProfile');


exports.createOrGetProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email || '';
    const fullName = req.user.name || 'Unknown'; // Firebase me name field

    // Check if profile already exists
    let profile = await UserProfile.findByFirebaseUID(uid);

    if (!profile) {
      profile = new UserProfile({
        firebaseUID: uid,
        basicInfo: {
          fullName: fullName,
          dateOfBirth: new Date('2000-01-01'), // Dummy DOB
          gender: 'Other',                     // Default gender
          bloodGroup: 'O+'                     // Default blood group
        },
        contactInfo: { 
          primaryPhone: '+10000000000',        // Dummy phone
          email 
        },
        emergencyContact: {
          name: 'Unknown',                     // Dummy name
          relationship: 'Other',               // Default value
          phoneNumber: '+10000000000',         // Dummy phone
          enableSMS: true,
          enableCall: true
        }
      });

      await profile.save();
      return res.status(201).json({ success: true, message: 'Profile created', data: profile });
    }

    return res.json({ success: true, message: 'Profile fetched', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;

    // Ensure nested fields are updated properly
    const profile = await UserProfile.findOneAndUpdate(
      { firebaseUID: uid },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({ success: true, message: 'Profile updated', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.addMedicalCondition = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await profile.addMedicalCondition(req.body);
    return res.json({ success: true, message: 'Condition added', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.addAllergy = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await profile.addAllergy(req.body);
    return res.json({ success: true, message: 'Allergy added', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.addMedication = async (req, res) => {
  try {
    const uid = req.user.uid;
    const profile = await UserProfile.findByFirebaseUID(uid);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await profile.addMedication(req.body);
    return res.json({ success: true, message: 'Medication added', data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
