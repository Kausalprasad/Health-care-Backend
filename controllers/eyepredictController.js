// backend/controllers/eyepredictController.js
const path = require("path");
const { execFile } = require("child_process");

exports.predictEye = (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const imagePath = req.file.path;
  const pythonPath = "python"; // ya full path agar required ho
  const scriptPath = path.join(__dirname, "../python/models/eye/predict_eye.py");

  execFile(pythonPath, [scriptPath, imagePath], (error, stdout, stderr) => {
    if (error) return res.status(500).send(error.message);
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
};
