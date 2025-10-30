const express = require("express");
const {
  analyzeAndSaveRisk,
  getUserRiskReports,
  deleteRiskReport,
} = require("../controllers/riskController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 🧩 Protected routes
router.post("/analyze-risk", authMiddleware, analyzeAndSaveRisk);
router.get("/analyze-risk", authMiddleware, getUserRiskReports);
router.delete("/analyze-risk/:id", authMiddleware, deleteRiskReport);

module.exports = router;