const { spawn } = require("child_process");
const path = require("path");

exports.predictCosmetic = (req, res) => {
  if (!req.file || !req.body.skin_type) {
    return res.status(400).json({ error: "Image and skin_type are required" });
  }

  const imagePath = path.resolve(req.file.path);
  const skinType = req.body.skin_type.toLowerCase();
  const scriptPath = path.resolve("python/models/cosmetic/predict_cosmetic.py");

  const pythonProcess = spawn("python", [scriptPath, imagePath, skinType]);

  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
  });

  pythonProcess.on("close", () => {
    try {
      res.json(JSON.parse(result.replace(/'/g, '"')));
    } catch (err) {
      res.status(500).json({ error: "Failed to parse model output" });
    }
  });
};
