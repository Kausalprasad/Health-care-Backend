// backend/routes/anemiaNailRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { predictAnemia } = require("../controllers/anemiaNailController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.post("/anemia-nail", upload.single("image"), predictAnemia);

module.exports = router;
