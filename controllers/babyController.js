const { spawn } = require("child_process");
const path = require("path");
const BabyRecommendation = require("../models/baby");

// 🟢 Logs helper
const log = (message, data) => {
  console.log(`🟢 [BabyController] ${message}`, data || "");
};

// 🍼 POST - Run Python model + save in MongoDB
exports.getRecommendations = async (req, res) => {
  log("Request received", req.body);

  try {
    const userId = req.user.uid; // Firebase UID
    const babyData = req.body;

    const pythonProcess = spawn(
      "python",
      [
        path.join(__dirname, "../python/models/baby_recommender/recommend.py"),
        JSON.stringify(babyData),
      ],
      { env: { ...process.env } } // Pass GROQ_API_KEY to Python
    );

    let resultData = "";

    pythonProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on("data", (err) => {
      log("Python error:", err.toString());
    });

    pythonProcess.on("close", async (code) => {
      log(`Python process exited with code ${code}`);

      try {
        const result = JSON.parse(resultData);

        // ✅ Save record to MongoDB
        const record = await BabyRecommendation.create({
          user: userId,
          inputData: babyData,
          recommendation: result,
        });

        res.status(200).json({
          message: "Baby recommendation generated & saved successfully.",
          data: record,
        });
      } catch (err) {
        log("Error parsing Python response:", err.message);
        res.status(500).json({
          status: "error",
          error_message: "Failed to parse Python response",
          error_type: err.name,
        });
      }
    });
  } catch (error) {
    log("Server error:", error.message);
    res.status(500).json({
      status: "error",
      error_message: "Internal server error",
      error_type: error.name,
    });
  }
};

// 📋 GET - Fetch all saved baby recommendations (for logged-in user)
exports.getAllBabyRecommendations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const records = await BabyRecommendation.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    log("Error fetching baby recommendations:", error.message);
    res.status(500).json({ error: "Failed to fetch records", details: error.message });
  }
};

// ❌ DELETE - Remove a specific baby recommendation
exports.deleteBabyRecommendation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const record = await BabyRecommendation.findOneAndDelete({ _id: id, user: userId });

    if (!record) {
      return res.status(404).json({ error: "Record not found or unauthorized" });
    }

    res.status(200).json({ message: "Baby recommendation deleted successfully" });
  } catch (error) {
    log("Error deleting baby recommendation:", error.message);
    res.status(500).json({ error: "Failed to delete record", details: error.message });
  }
};
