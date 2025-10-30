const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Firebase UID
      required: true,
    },
    inputData: {
      type: Object, // user health input JSON
      required: true,
    },
    assessment: {
      type: Object, // full AI response JSON
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);