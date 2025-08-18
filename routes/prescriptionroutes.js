const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const prescriptionController = require("../controllers/prescription.controller");

// Multer storage config — extension preserve karega


const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });


router.post("/read", upload.single("file"), prescriptionController.readPrescription);

module.exports = router;
