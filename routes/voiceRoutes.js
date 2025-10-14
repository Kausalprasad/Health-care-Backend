const express = require("express");
const multer = require("multer");
const { processVoice } = require("../controllers/voiceController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/voice
router.post("/", upload.single("audio"), processVoice);

module.exports = router;
