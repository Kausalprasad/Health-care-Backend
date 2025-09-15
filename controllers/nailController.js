const { spawn } = require("child_process");
const path = require("path");

exports.predictNail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = path.join(__dirname, "..", "uploads", req.file.filename);
    const pythonFile = path.join(__dirname, "..", "python", "models", "nail", "predict_nail.py");

    const py = spawn("python", [pythonFile, imagePath]);

    let result = "";
    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "Prediction failed" });
      }
      try {
        const parsed = JSON.parse(result);
        return res.json(parsed);
      } catch (err) {
        return res.status(500).json({ error: "Invalid response from model" });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
