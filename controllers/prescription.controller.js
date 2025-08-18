const { runPythonModel } = require("../services/prescription.service");

exports.readPrescription = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await runPythonModel(req.file.path);
    res.json(result);

  } catch (err) {
    console.error("readPrescription error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
};
