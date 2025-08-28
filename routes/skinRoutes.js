const express = require("express");
const multer = require("multer");
const { analyzeSkin } = require("../controllers/skinController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/analyze", upload.single("image"), analyzeSkin);

module.exports = router;
