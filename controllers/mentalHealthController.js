// controllers/mentalHealthController.js
const { spawn } = require("child_process");
const path = require("path");

exports.getTherapyResponse = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res
        .status(400)
        .json({ reply: "⚠️ message and sessionId are required" });
    }

    const pythonFile = path.join(
      __dirname,
      "../python/models/MentalHealth/mental_health_runner.py"
    );

    const pythonProcess = spawn("python", [pythonFile]);

    let responseData = "";

    pythonProcess.stdout.on("data", (data) => {
      responseData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("close", () => {
      console.log("👉 Python Output:", responseData);

      try {
        const parsed = JSON.parse(responseData.trim());
        // Always send reply field
        res.json({ reply: parsed.reply || "⚠️ No reply from AI" });
      } catch (err) {
        console.error("Parse error:", err);
        res.json({ reply: "⚠️ Failed to parse AI response" });
      }
    });

    // Send JSON input to Python
    pythonProcess.stdin.write(JSON.stringify({ message, sessionId }));
    pythonProcess.stdin.end();
  } catch (err) {
    console.error("Controller error:", err);
    res.json({ reply: "⚠️ Something went wrong in backend" });
  }
};
