const express = require("express");
const {
  getRecommendations,
  getAllBabyRecommendations,
  deleteBabyRecommendation,
} = require("../controllers/babyController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST - Run model and save recommendation
router.post("/recommend", authMiddleware, getRecommendations);

// GET - Fetch all recommendations of user
router.get("/recommendations", authMiddleware, getAllBabyRecommendations);

// DELETE - Remove specific recommendation
router.delete("/recommendations/:id", authMiddleware, deleteBabyRecommendation);

module.exports = router;
