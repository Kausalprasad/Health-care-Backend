const express = require("express");
const router = express.Router();
const { addHealthData, getHealthData } = require("../controllers/healthController");
const authMiddleware = require("../middlewares/authMiddleware");

// Add health data
router.post("/", authMiddleware, addHealthData);

// Get health data
router.get("/", authMiddleware, getHealthData);

module.exports = router;
