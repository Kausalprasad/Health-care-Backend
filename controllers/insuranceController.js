// controllers/insuranceController.js
const { spawn } = require("child_process");
const path = require("path");

exports.predictInsuranceClaim = async (req, res) => {
  console.log("📩 [LOG] Predict request:", req.body);

  try {
    const pythonPath = path.join(
      __dirname,
      "../python/models/insurance/insurance.py"
    );

    const py = spawn("python", [pythonPath, "predict", JSON.stringify(req.body)]);
    let resultData = "";
    let errorData = "";

    py.stdout.on("data", (data) => (resultData += data.toString()));
    py.stderr.on("data", (data) => {
      errorData += data.toString();
      console.error("❌ [Python Error]:", data.toString());
    });

    py.on("close", (code) => {
      console.log("✅ [LOG] Python exited with code:", code);
      if (errorData) {
        return res.status(500).json({ status: "error", error: errorData });
      }

      try {
        const parsed = JSON.parse(resultData);
        res.status(200).json(parsed);
      } catch (err) {
        console.error("❌ JSON Parse Error:", err);
        res.status(500).json({ status: "error", error: "Invalid JSON from Python" });
      }
    });
  } catch (err) {
    console.error("💥 Controller Error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
};

exports.generatePatientBill = async (req, res) => {
  console.log("📩 [LOG] Bill request:", req.body);

  try {
    const pythonPath = path.join(
      __dirname,
      "../python/models/insurance/insurance.py"
    );

    const py = spawn("python", [pythonPath, "bill", JSON.stringify(req.body)]);
    let resultData = "";
    let errorData = "";

    py.stdout.on("data", (data) => (resultData += data.toString()));
    py.stderr.on("data", (data) => {
      errorData += data.toString();
      console.error("❌ [Python Error]:", data.toString());
    });

    py.on("close", (code) => {
      console.log("✅ [LOG] Python exited with code:", code);
      if (errorData) {
        return res.status(500).json({ status: "error", error: errorData });
      }

      try {
        const parsed = JSON.parse(resultData);
        res.status(200).json(parsed);
      } catch (err) {
        console.error("❌ JSON Parse Error:", err);
        res.status(500).json({ status: "error", error: "Invalid JSON from Python" });
      }
    });
  } catch (err) {
    console.error("💥 Controller Error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
};
