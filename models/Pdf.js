const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Pdf || mongoose.model("Pdf", pdfSchema);
