// routes/mentalHealthRoutes.js
const express = require("express");
const router = express.Router();
const { getTherapyResponse } = require("../controllers/mentalHealthController");

// POST /api/mental-health/therapy
router.post("/therapy", getTherapyResponse);

module.exports = router;
