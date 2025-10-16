// routes/insuranceRoutes.js
const express = require("express");
const router = express.Router();
const {
  predictInsuranceClaim,
  generatePatientBill
} = require("../controllers/insuranceController");

// POST -> Predict claim amount
router.post("/predict", predictInsuranceClaim);

// POST -> Generate patient bill
router.post("/bill", generatePatientBill);

module.exports = router;
