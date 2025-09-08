const express = require("express");
const router = express.Router();
const multer = require("multer");
const { predictVideo } = require("../controllers/melanomaController");

const upload = multer({ dest: "uploads/" });

// POST route to analyze uploaded video
router.post("/video-predict", upload.single("video"), predictVideo);

module.exports = router;
