const express = require("express");
const multer = require("multer");
const path = require("path");
const { predictHairCondition } = require("../controllers/hairController");

const router = express.Router();

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Route -> POST /api/hair/predict
router.post("/predict", upload.single("image"), predictHairCondition);

module.exports = router;
