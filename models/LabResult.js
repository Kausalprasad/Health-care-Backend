const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  result: {
    type: Object, // Python se jo JSON milega
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("LabResult", LabResultSchema);
