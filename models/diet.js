const mongoose = require("mongoose");

const dietSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Firebase UID
      required: true,
      index: true,
    },
    goal: {
      type: String,
      enum: ["weight loss", "muscle building", "weight gain", "maintain weight"],
      required: true,
    },
    user_profile: {
      height: String,
      weight: String,
      age: String,
      sex: String,
      bmi: Number,
      health_category: String,
      medical_conditions: [String],
      allergies: [String],
      target_calories: Number,
      budget_category: String,
    },
    dietary_guidelines: String,
    allergy_modifications: String,
    economic_strategy: String,
    diet_plan: String, // AI generated text
    bmr: Number,
    generated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diet", dietSchema);