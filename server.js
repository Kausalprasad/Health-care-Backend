const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const pdfRoutes = require("./routes/pdfRoutes");
const FileModel = require("./models/Pdf");
const symptomPredictRoutes = require("./routes/symptomPredictRoutes");
const anemiaNailRoutes = require("./routes/anemiaNailRoutes");
const gameRoutes = require("./routes/gameRoutes");
const aiDoctorRoutes = require("./routes/aiDoctor.routes");
const tongueDiseaseRoutes = require("./routes/tongueDiseaseRoutes");
const chatRoutes = require('./routes/chatRoutes');
const prescriptionRoutes = require("./routes/prescriptionroutes");
const { execSync } = require("child_process");




dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", require("./routes/healthRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/uploads", express.static("uploads")); // Serve PDFs
app.use("/api/pdfs", pdfRoutes);
app.use("/api", symptomPredictRoutes);
app.use("/api", anemiaNailRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/ai-doctor", aiDoctorRoutes);
app.use("/api", tongueDiseaseRoutes);
app.use('/api', chatRoutes);
app.use("/api/prescription", prescriptionRoutes);
console.log("⬇️ Checking & downloading models from S3...");
try {
  execSync("python python/download_models.py", { stdio: "inherit" });
  console.log("✅ Models ready");
} catch (error) {
  console.error("❌ Error while downloading models:", error.message);
}

// 📂 Get all PDFs for a specific user by email
app.get("/api/files", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const files = await FileModel.find({ userId: email });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "127.0.0.1", () =>  console.log(`🚀 Server running on port ${PORT}`));
