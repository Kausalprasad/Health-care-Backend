const express = require("express");
const multer = require("multer");
const { predictCosmetic } = require("../controllers/cosmeticController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/predict", upload.single("image"), predictCosmetic);

module.exports = router;
