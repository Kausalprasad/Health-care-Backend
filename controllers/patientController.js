const Patient = require("../models/Patient");

// Add Patient
exports.addPatient = async (req, res) => {
  try {
    const patient = new Patient({
      ...req.body,
      userId: req.user.uid  // Firebase UID se link
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all patients of logged-in user
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ userId: req.user.uid });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single patient
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      userId: req.user.uid
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      req.body,
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: "Patient not found or not authorized" });
    }

    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.uid
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found or not authorized" });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
