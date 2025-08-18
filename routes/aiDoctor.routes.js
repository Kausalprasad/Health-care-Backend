const express = require("express");
const { getAdvice } = require("../controllers/aiDoctor.controller");

const router = express.Router();

router.post("/advice", getAdvice);

module.exports = router;
