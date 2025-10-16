// backend/models/pregnancy.js
const mongoose = require("mongoose");

const pregnancySchema = new mongoose.Schema(
  {
    user: {
      type: String, // Firebase UID
      required: true,
    },
    inputData: {
      type: Object,
      required: true,
    },
    recommendation: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PregnancyRecommendation", pregnancySchema);
