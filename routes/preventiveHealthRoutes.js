const express = require("express");
const { getPreventiveHealthPrediction,} = require("../controllers/preventiveHealthController");

const router = express.Router();

// POST request with patient data
router.post("/predict", getPreventiveHealthPrediction);

module.exports = router;
