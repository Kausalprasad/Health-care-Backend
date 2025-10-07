const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Function to run Python script
function runPython(command, imagePath, res) {
  console.log("[XRayController] Running Python script...");
  console.log("[XRayController] Image path:", imagePath);

  const pyScript = path.join(__dirname, "../python/models/xray/xray.py");
  const py = spawn("python", [pyScript, command, imagePath]);

  let result = "";
  let error = "";

  py.stdout.on("data", (data) => (result += data.toString()));
  py.stderr.on("data", (data) => (error += data.toString()));

  py.on("close", (code) => {
    console.log("[XRayController] Python script exited with code:", code);
    if (error) console.error("[XRayController][Python Error]:", error);

    if (code !== 0) {
      return res.status(500).json({ success: false, error });
    }

    try {
      const output = JSON.parse(result);
      console.log("[XRayController] Python output:", output);
      res.json({ success: true, data: output });
    } catch (err) {
      console.error("[XRayController] JSON parse error:", err);
      res.status(500).json({ success: false, error: "Invalid JSON from Python" });
    }
  });
}

// XRay analysis route controller
exports.analyzeXray = (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No image uploaded" });

  const imagePath = path.join(__dirname, "../uploads", req.file.filename);

  if (!fs.existsSync(imagePath)) {
    console.error("[XRayController] File not found:", imagePath);
    return res.status(400).json({ success: false, message: "File not found" });
  }

  console.log("[XRayController] Received file:", req.file.filename);
  runPython("analyze", imagePath, res);
};
