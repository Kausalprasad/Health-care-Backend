// backend/controllers/anemiaNailController.js
const { spawn } = require("child_process");
const path = require("path");

exports.predictAnemia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const filePath = path.resolve(req.file.path);

    const python = spawn("python", [
      "python/run_model.py",
      "anemia_nail",
      filePath,
    ]);

    let result = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("❌ Python Error:", errorOutput);
        return res.status(500).json({ message: "Python model failed", error: errorOutput });
      }

      try {
        const output = JSON.parse(result);
        res.json({ message: "Prediction complete", result: output });
      } catch (err) {
        res.status(500).json({ message: "Failed to parse model output", raw: result });
      }
    });
  } catch (error) {
    console.error("❌ Anemia Predict Error:", error);
    res.status(500).json({ message: "Prediction Error", error: error.message });
  }
};
