const express = require("express");
const multer = require("multer");
const { predictTongueDisease } = require("../controllers/tongueDiseaseController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/tongue-disease", upload.single("file"), predictTongueDisease);

module.exports = router;
