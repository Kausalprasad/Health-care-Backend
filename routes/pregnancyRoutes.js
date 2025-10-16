const express = require("express");
const {
  getPregnancyRecommendation,
  getAllPregnancyRecommendations,
  deletePregnancyRecommendation,
} = require("../controllers/pregnancyController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST - run and save recommendation
router.post("/recommend", authMiddleware, getPregnancyRecommendation);

// GET - fetch all user recommendations
router.get("/recommendations", authMiddleware, getAllPregnancyRecommendations);

// DELETE - delete a specific recommendation by ID
router.delete("/recommendations/:id", authMiddleware, deletePregnancyRecommendation);

module.exports = router;
