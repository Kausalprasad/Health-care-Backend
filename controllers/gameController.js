const GameResult = require("../models/GameResult");

// Save game result
exports.saveGameResult = async (req, res) => {
  try {
    const { userId, gameName, score, duration } = req.body;

    if (!userId || !gameName || score == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newResult = new GameResult({ userId, gameName, score, duration });
    await newResult.save();

    res.status(201).json({ message: "Game result saved successfully", result: newResult });
  } catch (error) {
    res.status(500).json({ message: "Error saving game result", error: error.message });
  }
};

// Get game history
exports.getGameHistory = async (req, res) => {
  try {
    const { userId, gameName } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (gameName) filter.gameName = gameName;

    const results = await GameResult.find(filter).sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game history", error: error.message });
  }
};
