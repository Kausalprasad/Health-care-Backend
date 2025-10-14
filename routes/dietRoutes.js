const express = require("express");
const router = express.Router();
const { getDietPlan, getUserDiets, deleteDiet } = require("../controllers/dietController");
const authMiddleware = require("../middlewares/authMiddleware");

// Protected routes
router.post("/diet", authMiddleware, getDietPlan);
router.get("/diet", authMiddleware, getUserDiets);
router.delete("/diet/:id", authMiddleware, deleteDiet);

module.exports = router;
