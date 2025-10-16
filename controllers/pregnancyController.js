const { spawn } = require("child_process");
const path = require("path");
const PregnancyRecommendation = require("../models/pregnancy");

// 🩺 POST: Run Python model + save result
const getPregnancyRecommendation = async (req, res) => {
  try {
    const userId = req.user.uid; // Firebase UID
    const inputData = req.body;

    const pythonProcess = spawn("python", [
      path.join(__dirname, "../python/models/pregnancy_recommender/recommend.py"),
      JSON.stringify(inputData),
    ]);

    let resultData = "";

    pythonProcess.stdout.on("data", (data) => (resultData += data.toString()));
    pythonProcess.stderr.on("data", (data) => console.error("Python error:", data.toString()));

    pythonProcess.on("close", async () => {
      try {
        const output = JSON.parse(resultData);

        const record = await PregnancyRecommendation.create({
          user: userId,
          inputData,
          recommendation: output,
        });

        res.status(200).json({
          message: "Pregnancy recommendation saved successfully.",
          data: record,
        });
      } catch (err) {
        console.error("Error parsing/saving:", err);
        res.status(500).json({ error: "Failed to process recommendation", details: err.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

// 📋 GET: Fetch all records for logged-in user
const getAllPregnancyRecommendations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const records = await PregnancyRecommendation.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch records", details: error.message });
  }
};

// ❌ DELETE: Delete one record by ID
const deletePregnancyRecommendation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const record = await PregnancyRecommendation.findOneAndDelete({ _id: id, user: userId });

    if (!record) {
      return res.status(404).json({ error: "Record not found or unauthorized" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete record", details: error.message });
  }
};

module.exports = {
  getPregnancyRecommendation,
  getAllPregnancyRecommendations,
  deletePregnancyRecommendation,
};
