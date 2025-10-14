const express = require("express");
const router = express.Router();
const babyController = require("../controllers/babyController");

// POST /api/baby/recommend
router.post("/recommend", babyController.getRecommendations);

module.exports = router;
