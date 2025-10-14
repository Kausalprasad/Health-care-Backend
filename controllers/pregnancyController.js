// backend/controllers/pregnancyController.js
const { spawn } = require("child_process");
const path = require("path");

const getPregnancyRecommendation = (req, res) => {
  try {
    const inputData = req.body;

    const pythonProcess = spawn("python", [
      path.join(__dirname, "../python/models/pregnancy_recommender/recommend.py"),
      JSON.stringify(inputData),
    ]);

    let resultData = "";

    pythonProcess.stdout.on("data", (data) => resultData += data.toString());
    pythonProcess.stderr.on("data", (data) => console.error("Python error:", data.toString()));

    pythonProcess.on("close", () => {
      try {
        const output = JSON.parse(resultData);
        res.json(output);
      } catch (err) {
        res.status(500).json({ error: "Failed to parse Python output", details: err.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};

module.exports = { getPregnancyRecommendation };
