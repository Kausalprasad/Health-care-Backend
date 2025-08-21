// backend/routes/eyepredictRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { predictEye } = require("../controllers/eyepredictController");

// Root uploads folder
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Eye prediction route
router.post("/eye", upload.single("image"), predictEye);


module.exports = router;
