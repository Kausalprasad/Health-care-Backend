// routes/moodRoutes.js
const express = require("express");
const router = express.Router();
const { saveMood, getMoods } = require("../controllers/moodController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/save", authMiddleware, saveMood);
router.get("/calendar", authMiddleware, getMoods);

module.exports = router;
