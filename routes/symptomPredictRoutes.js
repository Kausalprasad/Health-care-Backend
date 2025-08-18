const express = require("express");
const multer = require("multer");
const { predictSymptoms, predictSymptomsFromVoice } = require("../controllers/symptomPredictController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Text prediction route
router.post("/predict", predictSymptoms);

// Voice prediction route
router.post("/predict-voice", upload.single("audio"), predictSymptomsFromVoice);

module.exports = router;
