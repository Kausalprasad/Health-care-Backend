// backend/models/baby.js
const mongoose = require("mongoose");

const babySchema = new mongoose.Schema(
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

module.exports = mongoose.model("BabyRecommendation", babySchema);
