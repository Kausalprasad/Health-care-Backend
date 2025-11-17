const mongoose = require("mongoose");

const dosageSchema = new mongoose.Schema({
  time: { type: String, required: true }, // e.g. "8:00 am"
  dose: { type: String, required: true }  // e.g. "1 Tablet"
});

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: String, // Firebase UID
    required: true,
  },
  prescriptionName: { type: String, required: true },
  prescriptionType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dosages: [dosageSchema],
}, { timestamps: true });

module.exports = mongoose.model("Prescription", prescriptionSchema);