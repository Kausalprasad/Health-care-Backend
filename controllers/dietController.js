const { spawn } = require("child_process");
const path = require("path");
const Diet = require("../models/diet");

// Generate Diet Plan
const getDietPlan = async (req, res) => {
  try {
    console.log("[DietController] API hit by user:", req.user.uid);

    const requiredFields = ["height", "weight", "sex", "region", "goal", "food_preference", "activity_level"];
    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length > 0)
      return res.status(400).json({ success: false, error: `Missing: ${missing.join(", ")}` });

    const pythonPath = path.join(__dirname, "../python/models/diet/diet.py");
    const py = spawn("python", [pythonPath]);

    let result = "", errorMsg = "";

    py.stdin.write(JSON.stringify(req.body));
    py.stdin.end();

    py.stdout.on("data", (data) => (result += data.toString()));
    py.stderr.on("data", (data) => (errorMsg += data.toString()));

    py.on("close", async (code) => {
      if (code !== 0) {
        return res.status(500).json({ success: false, error: "Python failed", details: errorMsg });
      }

      try {
        const parsed = JSON.parse(result);
        if (!parsed.success) return res.status(500).json(parsed);

        // Save to DB (User-Specific)
        const savedDiet = await Diet.create({
          userId: req.user.uid,
          goal: req.body.goal, // Store goal directly from request
          ...parsed,
        });

        res.status(200).json({
          success: true,
          message: "Diet plan generated & saved successfully",
          diet: savedDiet,
        });
      } catch (err) {
        console.error("[DietController] JSON parse error:", err.message);
        res.status(500).json({ success: false, error: "Failed to parse or save diet" });
      }
    });
  } catch (err) {
    console.error("[DietController] Catch error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Fetch all user's diet plans
const getUserDiets = async (req, res) => {
  try {
    const diets = await Diet.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json({ success: true, diets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete a diet plan
const deleteDiet = async (req, res) => {
  try {
    const { id } = req.params;
    const diet = await Diet.findOneAndDelete({ _id: id, userId: req.user.uid });
    if (!diet) return res.status(404).json({ success: false, error: "Diet not found or not authorized" });

    res.json({ success: true, message: "Diet deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDietPlan, getUserDiets, deleteDiet };