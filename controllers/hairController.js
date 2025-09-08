const { spawn } = require("child_process");
const path = require("path");

exports.predictHairCondition = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const imagePath = path.join(__dirname, "../uploads", req.file.filename);

  // Run Python script
  const pythonProcess = spawn("python", [
    path.join(__dirname, "../python/models/hair/hairpredict.py"),
    imagePath,
  ]);

  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`❌ Python Error: ${data}`);
  });

  pythonProcess.on("close", () => {
    try {
      const prediction = JSON.parse(result);
      res.json(prediction);
    } catch (err) {
      res.status(500).json({ error: "Failed to parse prediction" });
    }
  });
};
