const mongoose = require("mongoose");

const healthDataSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID
  heartRate: Number,
  bloodPressure: String,
  steps: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HealthData", healthDataSchema);
