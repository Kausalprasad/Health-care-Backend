const Prescription = require("../models/Prescription");

// ✅ Add a new prescription
exports.addPrescription = async (req, res) => {
  console.log("📥 Incoming prescription data:", req.body);
  console.log("👤 Firebase UID:", req.user.uid);

  try {
    const { prescriptionName, prescriptionType, startDate, endDate, dosages } = req.body;

    const prescription = new Prescription({
      user: req.user.uid,
      prescriptionName,
      prescriptionType,
      startDate,
      endDate,
      dosages,
    });

    await prescription.save();
    console.log("✅ Prescription saved:", prescription);

    res.status(201).json({ message: "Prescription added successfully", prescription });
  } catch (error) {
    console.error("❌ Error adding prescription:", error);
    res.status(500).json({ message: "Error adding prescription", error: error.message });
  }
};

// ✅ Get all prescriptions for the logged-in Firebase user
exports.getPrescriptions = async (req, res) => {
  console.log("📤 Fetching prescriptions for UID:", req.user.uid);

  try {
    const prescriptions = await Prescription.find({ user: req.user.uid }).sort({ createdAt: -1 });
    console.log("✅ Found prescriptions:", prescriptions.length);
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("❌ Error fetching prescriptions:", error);
    res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
  }
};

// ✅ Get a single prescription by ID
exports.getPrescriptionById = async (req, res) => {
  console.log("🔍 Fetching prescription ID:", req.params.id, "for UID:", req.user.uid);

  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, user: req.user.uid });
    if (!prescription) {
      console.log("⚠️ Prescription not found");
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.status(200).json(prescription);
  } catch (error) {
    console.error("❌ Error fetching prescription:", error);
    res.status(500).json({ message: "Error fetching prescription", error: error.message });
  }
};

// ✅ Delete a prescription
exports.deletePrescription = async (req, res) => {
  console.log("🗑️ Deleting prescription ID:", req.params.id, "for UID:", req.user.uid);

  try {
    const prescription = await Prescription.findOneAndDelete({
      _id: req.params.id,
      user: req.user.uid,
    });

    if (!prescription) {
      console.log("⚠️ Prescription not found for deletion");
      return res.status(404).json({ message: "Prescription not found" });
    }

    console.log("✅ Prescription deleted:", prescription._id);
    res.status(200).json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting prescription:", error);
    res.status(500).json({ message: "Error deleting prescription", error: error.message });
  }
};