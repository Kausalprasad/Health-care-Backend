const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    trim: true
  },
  relation: {
    type: String,
    required: true,
    enum: [
      "Self",
      "Father",
      "Mother",
      "Spouse",
      "Son",
      "Daughter",
      "Brother",
      "Sister",
      "Other"
    ]
  },
  dob: {
    type: String, // DD-MM-YYYY
    required: true
  },
  age: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"]
  },
  height: {
    type: String,
    default: ""
  },
  weight: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// update timestamp
patientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
