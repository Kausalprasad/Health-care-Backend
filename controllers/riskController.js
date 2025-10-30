const axios = require("axios");
const RiskAssessment = require("../models/RiskAssessment");

// 🧠 POST → Analyze + Save
const analyzeAndSaveRisk = async (req, res) => {
  console.log("📩 POST /api/analyze-risk");

  try {
    const userId = req.user.uid;
    const userInput = req.body;

    console.log("👤 User:", userId);
    console.log("🧾 Input Data:", JSON.stringify(userInput, null, 2));

    // 1️⃣ Call AI API
    console.log("🚀 Sending data to AI API...");
    const aiResponse = await axios.post(
      "https://n2se2og2dnseeularx6zjacdoa0irpib.lambda-url.ap-south-1.on.aws/analyze-risk",
      userInput
    );

    console.log("✅ AI Response received successfully");

    const aiData = aiResponse.data;

    // 2️⃣ Save to MongoDB
    const assessment = new RiskAssessment({
      user: userId,
      inputData: userInput,
      assessment: aiData,
    });

    await assessment.save();
    console.log("💾 Saved in MongoDB for user:", userId);

    res.status(200).json({
      message: "Risk assessment saved successfully!",
      data: assessment,
    });
  } catch (error) {
    console.error("❌ Error in analyzeAndSaveRisk:", error.message);

    res.status(500).json({
      error: "Failed to analyze or save risk data",
      details: error.message,
    });
  }
};

// 📊 GET → Fetch all user assessments
const getUserRiskReports = async (req, res) => {
  console.log("📩 GET /api/analyze-risk");

  try {
    const userId = req.user.uid;
    console.log("👤 Fetching risk reports for user:", userId);

    const assessments = await RiskAssessment.find({ user: userId }).sort({
      createdAt: -1,
    });

    if (!assessments.length) {
      return res.status(404).json({ message: "No risk assessments found." });
    }

    res.status(200).json({
      status: "success",
      results: assessments.length,
      data: assessments,
    });
  } catch (error) {
    console.error("❌ Error in getUserRiskReports:", error.message);
    res.status(500).json({
      error: "Failed to fetch risk reports",
      details: error.message,
    });
  }
};

// 🗑️ DELETE → Remove a specific report
const deleteRiskReport = async (req, res) => {
  console.log("🗑️ DELETE /api/analyze-risk/:id");

  try {
    const userId = req.user.uid;
    const reportId = req.params.id;

    console.log(`👤 User ${userId} wants to delete report ${reportId}`);

    const deleted = await RiskAssessment.findOneAndDelete({
      _id: reportId,
      user: userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    console.log(`✅ Report ${reportId} deleted for user ${userId}`);

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("❌ Error in deleteRiskReport:", error.message);
    res.status(500).json({
      error: "Failed to delete risk report",
      details: error.message,
    });
  }
};

module.exports = {
  analyzeAndSaveRisk,
  getUserRiskReports,
  deleteRiskReport,
};