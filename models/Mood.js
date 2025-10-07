// models/Mood.js
const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Firebase UID
  date: { type: String, required: true }, // "2025-09-25"
  emotion: { type: String, required: true },
  label: { type: String },
  color: { type: String },
  timestamp: { type: Date, default: Date.now },
});

moodSchema.index({ uid: 1, date: 1 }, { unique: true }); // ek user per date sirf ek mood

module.exports = mongoose.model("Mood", moodSchema);
