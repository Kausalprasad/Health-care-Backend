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
const eyeRoutes = require("./routes/eyepredictRoutes");
const skinRoutes = require('./routes/skinRoutes'); 
const cosmeticRoutes = require('./routes/cosmeticRoutes');
const doctorRoutes = require("./routes/doctorRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
// const melanomaRoutes = require("./routes/melanomaRoutes");
const mentalHealthRoutes = require("./routes/mentalHealthRoutes");
const hairRoutes = require("./routes/hairRoutes");
const nailRoutes = require("./routes/nailRoutes");
const userProfileRoutes=require('./routes/userProfileRoutes')
const webhookRoutes = require("./routes/webhook");
const startWatcher = require("./services/watcher");
const moodRoutes= require('./routes/moodRoutes')
const labRoutes = require("./routes/labRoutes");
const preventiveHealthRoutes = require("./routes/preventiveHealthRoutes");
const insuranceRoutes = require("./routes/insuranceRoutes");
const dietRoutes = require("./routes/dietRoutes");
const patientRoutes = require("./routes/patientRoutes");
// const xrayRoutes = require("./routes/xrayRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const pregnancyRoutes = require("./routes/pregnancyRoutes");
const babyRoutes = require("./routes/babyRoutes");



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
app.use("/api/predict", eyeRoutes);
app.use(express.json({ limit: "10mb" }));
app.use("/api/skin", skinRoutes);
app.use("/api/cosmetic", cosmeticRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/bookings", bookingRoutes);
// app.use("/api/malanom", melanomaRoutes);
app.use("/api/mental-health", mentalHealthRoutes);
app.use("/api/hair", hairRoutes);
app.use("/api/nail", nailRoutes);
app.use('/api',userProfileRoutes);
app.use("/webhook", webhookRoutes);
app.use("/moods", moodRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/preventive-health", preventiveHealthRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api", dietRoutes);
app.use("/api/patients", patientRoutes);
// app.use("/api/xray", xrayRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/pregnancy", pregnancyRoutes);
app.use("/api/baby", babyRoutes);

connectDB().then(() => {
  startWatcher(); // ✅ MongoDB watcher start
});


console.log("⬇️ Checking & downloading models from S3...");
try {
  execSync("python python/download_models.py", { stdio: "inherit" });
  console.log("✅ Models ready");
} catch (error) {
  console.error("❌ Error while downloading models:", error.message);
}
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error", error: err.message });
});

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
// app.listen(PORT, "127.0.0.1", () =>  console.log(`🚀 Server running on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () => 
  console.log(`🚀 Server running on port ${PORT}`)
);
