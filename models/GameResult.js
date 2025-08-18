const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Agar tumhare pass User model hai
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // seconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("GameResult", gameResultSchema);
