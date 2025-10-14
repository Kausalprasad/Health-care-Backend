// backend/routes/pregnancyRoutes.js
const express = require("express");
const { getPregnancyRecommendation } = require("../controllers/pregnancyController");

const router = express.Router();

// POST /api/pregnancy/recommend
router.post("/recommend", getPregnancyRecommendation);

module.exports = router;
