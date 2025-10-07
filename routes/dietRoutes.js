// backend/routes/dietRoutes.js
const express = require("express");
const router = express.Router();
const { getDietPlan } = require("../controllers/dietController");

router.post("/diet", getDietPlan);

module.exports = router;
