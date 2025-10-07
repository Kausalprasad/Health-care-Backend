const express = require("express");
const { status } = require("../controllers/melanomaController");

const router = express.Router();

// Health check route
router.get("/status", status);

module.exports = router;
