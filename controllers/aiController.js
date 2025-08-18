const { spawn } = require("child_process");
const path = require("path");

exports.processFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const pythonScript = path.join(__dirname, "../python/run_model.py");

  // ✅ Pass the model name as FIRST argument
  const modelName = "pdf_summary"; // or "anemia_nail" depending on the route

  const pyProcess = spawn(
    "C:\\Users\\Kaushal\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
    [pythonScript, modelName, req.file.path]
  );

  let result = "";
  let errorOutput = "";

  pyProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pyProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  pyProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        message: "Python model failed",
        error: errorOutput || "Unknown error",
      });
    }

    try {
      const parsed = JSON.parse(result);
      res.json({ message: "AI model processed successfully", output: parsed });
    } catch (err) {
      // Not JSON? Just return raw
      res.json({ message: "AI model processed successfully", output: result });
    }
  });
};
