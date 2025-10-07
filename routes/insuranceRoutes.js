// backend/routes/insuranceRoutes.js
const express = require("express");
const router = express.Router();
const insuranceController = require("../controllers/insuranceController");

router.post("/check-coverage", insuranceController.checkCoverage);
router.post("/recommend", insuranceController.recommendPlans);

module.exports = router;
