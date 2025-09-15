const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { predictNail } = require("../controllers/nailController");

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Route
router.post("/predict", upload.single("image"), predictNail);

module.exports = router;
