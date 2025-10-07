const express = require("express");
const multer = require("multer");
const path = require("path");
const { analyzeXray } = require("../controllers/xrayController");

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // unique filename
  },
});
const upload = multer({ storage });

// POST route to upload and analyze image
router.post("/upload", upload.single("xrayImage"), analyzeXray);

module.exports = router;
