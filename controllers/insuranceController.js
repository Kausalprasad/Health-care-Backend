// backend/controllers/insuranceController.js
const { spawn } = require("child_process");
const path = require("path");

const insurancePy = path.join(
  __dirname,
  "../python/models/insurance/insurance.py"
);

function runPython(command, patientData, res) {
  console.log("🚀 Running Python script...");
  console.log("👉 Command:", command);
  console.log("👉 Patient Data Sent:", JSON.stringify(patientData, null, 2));
  console.log("👉 Script Path:", insurancePy);

  const py = spawn("python", [insurancePy, command, JSON.stringify(patientData)]);

  let result = "";
  let error = "";

  py.stdout.on("data", (data) => {
    console.log("🐍 Python STDOUT:", data.toString());
    result += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error("❌ Python STDERR:", data.toString());
    error += data.toString();
  });

  py.on("close", (code) => {
    console.log("🔚 Python process closed with code:", code);

    if (error) {
      console.error("⚠️ Error returned:", error);
      return res.status(500).json({ success: false, error });
    }

    try {
      const parsed = JSON.parse(result);
      console.log("✅ Final Parsed Response:", parsed);
      res.json({ success: true, data: parsed });
    } catch (e) {
      console.error("❌ JSON Parse Error:", e.message);
      console.error("Raw Result from Python:", result);
      res.status(500).json({ success: false, error: "Invalid JSON from Python" });
    }
  });
}

exports.checkCoverage = (req, res) => {
  console.log("\n==============================");
  console.log("📌 API Hit: /check-coverage");
  runPython("check", req.body, res);
};

exports.recommendPlans = (req, res) => {
  console.log("\n==============================");
  console.log("📌 API Hit: /recommend");
  runPython("recommend", req.body, res);
};
