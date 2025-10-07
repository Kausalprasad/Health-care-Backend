// backend/controllers/dietController.js
const { spawn } = require("child_process");
const path = require("path");

const getDietPlan = async (req, res) => {
  try {
    console.log("[DietController] Enhanced API hit");
    console.log("[DietController] Request body:", JSON.stringify(req.body, null, 2));

    // Validate required fields
    const requiredFields = ["height", "weight", "sex", "region", "goal", "food_preference", "activity_level"];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    const pythonPath = path.join(__dirname, "../python/models/diet/diet.py");
    console.log("[DietController] Python script path:", pythonPath);

    const py = spawn("python", [pythonPath]);

    let result = "";
    let errorMsg = "";

    // Write input data to Python script
    py.stdin.write(JSON.stringify(req.body));
    py.stdin.end();

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      errorMsg += data.toString();
      console.error("[DietController] Python stderr:", data.toString());
    });

    py.on("close", (code) => {
      console.log(`[DietController] Python process exited with code ${code}`);
      
      if (code !== 0) {
        console.error("[DietController] Python Error Output:", errorMsg);
        return res.status(500).json({
          success: false,
          error: "Python script execution failed",
          details: errorMsg
        });
      }

      try {
        const parsed = JSON.parse(result);
        
        if (parsed.success) {
          console.log("[DietController] ✅ Diet plan generated successfully");
          console.log("[DietController] Profile BMI:", parsed.user_profile?.bmi);
          console.log("[DietController] Target Calories:", parsed.user_profile?.target_calories);
          console.log("[DietController] Medical Conditions:", parsed.user_profile?.medical_conditions);
          console.log("[DietController] Allergies:", parsed.user_profile?.allergies);
        } else {
          console.error("[DietController] ❌ Diet generation failed:", parsed.error);
        }

        res.json(parsed);
      } catch (parseError) {
        console.error("[DietController] JSON Parse Error:", parseError.message);
        console.error("[DietController] Raw output:", result);
        res.status(500).json({
          success: false,
          error: "Failed to parse Python response",
          raw: result.substring(0, 500) // Send first 500 chars for debugging
        });
      }
    });

    py.on("error", (error) => {
      console.error("[DietController] Spawn error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start Python process",
        details: error.message
      });
    });

  } catch (error) {
    console.error("[DietController] Catch block error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { getDietPlan };