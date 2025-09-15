const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.predictVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Video required" });
  }

  // Resolve video path
  const videoPath = path.resolve(req.file.path);

  // Correct: Resolve Python script path
  const pyScript = path.join(__dirname, "../python/models/melanoma/run_camera.py");

  // Debug logs
  console.log("Python script path:", pyScript);
  console.log("Video path:", videoPath);

  // Check if Python script exists
  if (!fs.existsSync(pyScript)) {
    return res.status(500).json({ error: "Python script not found", path: pyScript });
  }

  // Spawn Python process
  const py = spawn("python", [pyScript, videoPath]); // Use "python3" on Linux/macOS

  let output = "";

  py.stdout.on("data", (data) => {
    output += data.toString();
    console.log("[PYTHON]", data.toString());
  });

  py.stderr.on("data", (err) => {
    console.error("[PYTHON ERROR]", err.toString());
  });

  py.on("close", (code) => {
    // Delete uploaded video safely
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    } catch (err) {
      console.error("Failed to delete video:", err.toString());
    }

    // Parse Python output safely (ignore logs before JSON)
    try {
      const jsonStart = output.indexOf("{");
      if (jsonStart === -1) throw new Error("No JSON found in Python output");

      const jsonString = output.substring(jsonStart);
      const prediction = JSON.parse(jsonString);

      res.json({ success: true, prediction });
    } catch (e) {
      console.error("Failed to parse Python output:", output);
      res.status(500).json({ success: false, error: "Failed to parse prediction", details: output });
    }
  });
};
