const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  createVault,
  validatePin,
  updatePin,
  getVaultStatus,
  requestPinReset,
  verifyResetCode,
  resetPin
} = require("../controllers/vaultController");

// ✅ All vault routes require authentication
router.post("/create", authMiddleware, createVault);           // Create vault with PIN
router.post("/validate-pin", authMiddleware, validatePin);     // Validate PIN to unlock vault
router.put("/update-pin", authMiddleware, updatePin);          // Update/Change PIN
router.get("/status", authMiddleware, getVaultStatus);         // Check if vault exists

// ✅ PIN Reset Routes
router.post("/forgot-pin", authMiddleware, requestPinReset);   // Request PIN reset - Send verification code
router.post("/verify-reset-code", authMiddleware, verifyResetCode); // Verify reset code
router.post("/reset-pin", authMiddleware, resetPin);           // Reset PIN with verified token

module.exports = router;