const FileModel = require("../models/Pdf.js")
const fs = require("fs");

// 📤 Upload PDF
exports.uploadPdf = async (req, res) => {
  try {
    const { email } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const newFile = new FileModel({
      userId: email,
      fileName: req.file.originalname,
      filePath: req.file.path,
    });

    await newFile.save();
    res.json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    console.error("❌ Upload PDF Error:", error);
    res.status(500).json({ message: "Failed to upload PDF", error: error.message });
  }
};

// 📂 Get PDFs for specific user
exports.getUserPdfs = async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await FileModel.find({ userId });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to get PDFs", error: error.message });
  }
};

// 🗑 Delete PDF
exports.deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileModel.findByIdAndDelete(id);

    if (!file) return res.status(404).json({ message: "File not found" });

    // Delete from disk (safe)
    if (file.filePath && fs.existsSync(file.filePath)) {
      try {
        await fs.promises.unlink(file.filePath);
      } catch (err) {
        console.error("⚠️ Error deleting file from disk:", err.message);
      }
    }

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete file", error: error.message });
  }
};
