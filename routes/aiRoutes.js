const express = require("express");
const multer = require("multer");
const path = require("path");
const { processFile } = require("../controllers/aiController");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Route
router.post("/upload", upload.single("file"), processFile);

module.exports = router;
