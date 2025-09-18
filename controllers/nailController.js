const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.predictNail = async (req, res) => {
  try {
    console.log("👉 predictNail called");

    // 1) File presence check
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 2) Absolute paths
    const imagePath = path.resolve(__dirname, "../uploads", req.file.filename);
    const pythonFile = path.resolve(__dirname, "../python/models/nail/predict_nail.py");
    console.log("   Image path:", imagePath);
    console.log("   Python file:", pythonFile);

    // 3) Check file existence
    if (!fs.existsSync(imagePath)) {
      console.log("Uploaded image not found on disk");
      return res.status(400).json({ error: "Uploaded image not found", imagePath });
    }
    if (!fs.existsSync(pythonFile)) {
      console.log(" Python predictor script not found");
      return res.status(500).json({ error: "Python predictor script not found", pythonFile });
    }

    // 4) Spawn python process
    const pythonCmd = process.env.PYTHON_BIN || "python";
    console.log("   Spawning Python process with command:", pythonCmd);
    const py = spawn(pythonCmd, [pythonFile, imagePath]);

    let result = "";
    let stderr = "";
    const TIMEOUT_MS = 30_000;
    let killedByTimeout = false;

    const timeout = setTimeout(() => {
      killedByTimeout = true;
      console.log(` Python process killed after timeout (${TIMEOUT_MS} ms)`);
      try { py.kill("SIGKILL"); } catch (e) {}
    }, TIMEOUT_MS);

    py.stdout.on("data", (data) => {
      const text = data.toString();
      console.log("Python stdout:", text);
      result += text;
    });

    py.stderr.on("data", (data) => {
      const text = data.toString();
      console.error("Python stderr:", text);
      stderr += text;
    });

    py.on("close", (code) => {
      clearTimeout(timeout);
      console.log(` Python process closed with code ${code} (killedByTimeout=${killedByTimeout})`);

      if (killedByTimeout) {
        return res.status(500).json({ error: "Python process timeout", timeout_ms: TIMEOUT_MS, stdout: result, stderr });
      }

      if (code !== 0) {
        console.error("❌ Python exited with non-zero code");
        return res.status(500).json({ error: "Prediction failed", exitCode: code, stdout: result, stderr });
      }

      if (!result || result.trim().length === 0) {
        console.error("❌ No output from python script");
        return res.status(500).json({ error: "No output from python script", stdout: result, stderr });
      }

      // 5) Parse JSON and return directly
      try {
        const parsed = JSON.parse(result);
        console.log("✅ Prediction result parsed successfully");
        return res.json(parsed); // Direct output
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        return res.status(500).json({ error: "Invalid JSON returned by python script", parseError: err.message, raw: result, stderr });
      }
    });

    py.on("error", (err) => {
      console.error("❌ Failed to start python process:", err);
      return res.status(500).json({ error: "Failed to start python process", details: err.message });
    });

  } catch (err) {
    console.error("❌ predictNail server error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};
