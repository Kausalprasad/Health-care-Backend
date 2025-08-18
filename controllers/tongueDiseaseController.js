const { spawn } = require("child_process");
const path = require("path");

exports.predictTongueDisease = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imagePath = req.file.path;

  const pythonProcess = spawn("python", [
    path.join(__dirname, "../python/models/tongue_disease/predictor.py"),
    imagePath,
  ]);

  let dataString = "";
  let errorString = "";

  pythonProcess.stdout.on("data", (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    // Ignore TensorFlow info logs
    if (!msg.includes("TensorFlow binary is optimized") && !msg.includes("oneDNN custom operations")) {
      errorString += msg;
    }
  });

  pythonProcess.on("close", (code) => {
    if (errorString) console.error("Python Error:", errorString);

    try {
      const json = JSON.parse(dataString);
      if (json.error) return res.status(500).json(json);
      return res.json(json);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse prediction output", details: errorString || e.message });
    }
  });
};
