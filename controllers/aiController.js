const { spawn } = require("child_process");
const path = require("path");
const FileModel = require("../models/pdf"); // 👈 yeh add karna bhool gaya tha

// 📌 Upload PDF to MongoDB
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file info in MongoDB
    const file = new FileModel({
      userId: req.body.userId || "guest", // ya jo bhi user auth logic hai
      fileName: req.file.originalname,
      filePath: req.file.path,
    });

    await file.save();

    res.json({ message: "PDF uploaded successfully", file });
  } catch (err) {
    console.error("❌ Upload PDF Error:", err);
    res.status(500).json({ error: "Failed to upload PDF", details: err.message });
  }
};

// 📌 Process PDF with Python Model
exports.processFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const pythonScript = path.join(__dirname, "../python/run_model.py");
  const modelName = "pdf_summary"; // or "anemia_nail" based on route

  // ✅ Cross-platform Python path
  const pythonPath =
    process.env.PYTHON_PATH ||
    (process.platform === "win32"
      ? "C:\\Users\\Kaushal\\AppData\\Local\\Programs\\Python\\Python313\\python.exe"
      : "python3");

  const pyProcess = spawn(pythonPath, [pythonScript, modelName, req.file.path]);

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
      res.json({ message: "AI model processed successfully", output: result });
    }
  });
};
