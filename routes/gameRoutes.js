const express = require("express");
const { saveGameResult, getGameHistory } = require("../controllers/gameController");

const router = express.Router();

router.post("/result", saveGameResult);
router.get("/history", getGameHistory);

module.exports = router;
