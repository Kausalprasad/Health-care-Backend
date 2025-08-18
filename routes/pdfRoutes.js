const express = require("express");
const multer = require("multer");
const { uploadPdf, getUserPdfs, deletePdf } = require("../controllers/pdfController");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${req.body.email}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("file"), uploadPdf);
router.get("/:userId", getUserPdfs);
router.delete("/:id", deletePdf);

module.exports = router;
