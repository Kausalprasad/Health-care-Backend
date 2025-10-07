const { spawn } = require("child_process");
const path = require("path");

const getPreventiveHealthPrediction = async (req, res) => {
  try {
    console.log("[Controller] Preventive Health API hit");
    console.log("[Controller] Request body:", req.body);

    // Input validation
    const requiredFields = ['age', 'sex', 'bmi'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        missingFields: missingFields
      });
    }

    // Validate age range
    if (req.body.age < 18 || req.body.age > 100) {
      return res.status(400).json({
        success: false,
        error: "Age must be between 18 and 100"
      });
    }

    // Validate BMI range
    if (req.body.bmi < 10 || req.body.bmi > 50) {
      return res.status(400).json({
        success: false,
        error: "BMI must be between 10 and 50"
      });
    }

    const pythonPath = path.join(
      __dirname,
      "../python/models/preventiveHealth/preventiveHealth.py"
    );
    console.log("[Controller] Python script path:", pythonPath);

    // Add timeout for Python process
    const pyProcess = spawn("python", [pythonPath]);
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      pyProcess.kill();
      return res.status(408).json({
        success: false,
        error: "Python script timeout"
      });
    }, 10000); // 10 second timeout

    // Send request body to Python
    const inputData = JSON.stringify(req.body);
    console.log("[Controller] Sending data to Python:", inputData);
    pyProcess.stdin.write(inputData);
    pyProcess.stdin.end();

    let output = "";
    let errorOutput = "";

    pyProcess.stdout.on("data", (data) => {
      console.log("[Python STDOUT]:", data.toString());
      output += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      console.error("[Python STDERR]:", data.toString());
      errorOutput += data.toString();
    });

    pyProcess.on("close", (code) => {
      clearTimeout(timeout); // Clear timeout on completion
      console.log("[Controller] Python process closed with code:", code);

      if (code !== 0) {
        console.error("[Controller] Python failed:", errorOutput);
        return res.status(500).json({
          success: false,
          error: "Python script failed",
          details: errorOutput,
        });
      }

      try {
        const result = JSON.parse(output.trim()); // Trim whitespace
        console.log("[Controller] Parsed Python result:", result);
        
        // Validate Python response structure
        if (!result.health_score && result.health_score !== 0) {
          throw new Error("Invalid Python response structure");
        }
        
        res.json({ 
          success: true, 
          data: result,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error("[Controller] JSON parse error:", e.message);
        console.error("[Controller] Raw output:", output);
        res.status(500).json({ 
          success: false, 
          error: "Failed to parse Python response",
          details: e.message
        });
      }
    });

    // Handle Python process errors
    pyProcess.on("error", (error) => {
      clearTimeout(timeout);
      console.error("[Controller] Python process error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start Python process",
        details: error.message
      });
    });

  } catch (error) {
    console.error("[Controller] Exception occurred:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { getPreventiveHealthPrediction };