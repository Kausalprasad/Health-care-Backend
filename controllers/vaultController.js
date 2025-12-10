const Vault = require('../models/Vault');
const UserProfile = require('../models/UserProfile');
const PinReset = require('../models/PinReset');
const crypto = require('crypto');

// ✅ Request deduplication - prevent duplicate requests
const activeRequests = new Map(); // Store active requests by userId+token
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ✅ Create Vault (First Time Setup)
exports.createVault = async (req, res) => {
  console.log("📦 [CREATE VAULT] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;
    const { fullName, pin, confirmPin, recoveryEmail, useSameAsMain } = req.body;

    // ✅ Validation
    if (!fullName || !pin || !confirmPin || !recoveryEmail) {
      return res.status(400).json({
        success: false,
        message: "Full name, PIN, confirm PIN, and recovery email are required"
      });
    }

    // ✅ Validate PIN (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "PIN must be exactly 4 digits"
      });
    }

    // ✅ Check if PIN matches confirm PIN
    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: "PIN and confirm PIN do not match"
      });
    }

    // ✅ Check if vault already exists
    const existingVault = await Vault.findByFirebaseUID(userId);
    if (existingVault && existingVault.vaultCreated) {
      return res.status(400).json({
        success: false,
        message: "Vault already exists for this user"
      });
    }

    // ✅ Handle recovery email (use main email if requested)
    let finalRecoveryEmail = recoveryEmail;
    if (useSameAsMain) {
      const userProfile = await UserProfile.findByFirebaseUID(userId);
      if (userProfile && userProfile.contactInfo?.email) {
        finalRecoveryEmail = userProfile.contactInfo.email;
      }
    }

    // ✅ Create or Update Vault
    let vault;
    if (existingVault) {
      // Update existing
      existingVault.fullName = fullName;
      existingVault.pinHash = pin; // Will be hashed by pre-save hook
      existingVault.recoveryEmail = finalRecoveryEmail;
      existingVault.vaultCreated = true;
      existingVault.isActive = true;
      vault = await existingVault.save();
    } else {
      // Create new
      vault = await Vault.create({
        firebaseUID: userId,
        fullName,
        pinHash: pin, // Will be hashed by pre-save hook
        recoveryEmail: finalRecoveryEmail,
        vaultCreated: true,
        isActive: true
      });
    }

    console.log("✅ Vault created successfully for user:", userId);

    res.status(201).json({
      success: true,
      message: "Vault created successfully",
      vault: {
        _id: vault._id,
        firebaseUID: vault.firebaseUID,
        fullName: vault.fullName,
        recoveryEmail: vault.recoveryEmail,
        vaultCreated: vault.vaultCreated,
        isActive: vault.isActive,
        createdAt: vault.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Error creating vault:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create vault",
      error: error.message
    });
  }
};

// ✅ Validate PIN (For Login/Unlock)
exports.validatePin = async (req, res) => {
  console.log("🔐 [VALIDATE PIN] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "PIN is required"
      });
    }

    // ✅ Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "PIN must be exactly 4 digits"
      });
    }

    // ✅ Find vault
    const vault = await Vault.findByFirebaseUID(userId);
    if (!vault || !vault.vaultCreated) {
      return res.status(404).json({
        success: false,
        message: "Vault not found. Please create a vault first."
      });
    }

    // ✅ Compare PIN
    const isPinValid = await vault.comparePin(pin);

    if (!isPinValid) {
      console.log("❌ Invalid PIN attempt for user:", userId);
      return res.status(401).json({
        success: false,
        message: "Invalid PIN"
      });
    }

    console.log("✅ PIN validated successfully for user:", userId);

    res.json({
      success: true,
      message: "PIN validated successfully",
      vault: {
        _id: vault._id,
        firebaseUID: vault.firebaseUID,
        fullName: vault.fullName,
        vaultCreated: vault.vaultCreated,
        isActive: vault.isActive
      }
    });
  } catch (error) {
    console.error("❌ Error validating PIN:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to validate PIN",
      error: error.message
    });
  }
};

// ✅ Update PIN
exports.updatePin = async (req, res) => {
  console.log("🔄 [UPDATE PIN] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;
    const { currentPin, newPin, confirmPin } = req.body;

    // ✅ Validation
    if (!currentPin || !newPin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: "Current PIN, new PIN, and confirm PIN are required"
      });
    }

    // ✅ Validate PIN format
    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: "New PIN must be exactly 4 digits"
      });
    }

    // ✅ Check if new PIN matches confirm PIN
    if (newPin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: "New PIN and confirm PIN do not match"
      });
    }

    // ✅ Check if new PIN is different from current
    if (currentPin === newPin) {
      return res.status(400).json({
        success: false,
        message: "New PIN must be different from current PIN"
      });
    }

    // ✅ Find vault
    const vault = await Vault.findByFirebaseUID(userId);
    if (!vault || !vault.vaultCreated) {
      return res.status(404).json({
        success: false,
        message: "Vault not found"
      });
    }

    // ✅ Verify current PIN
    const isCurrentPinValid = await vault.comparePin(currentPin);
    if (!isCurrentPinValid) {
      return res.status(401).json({
        success: false,
        message: "Current PIN is incorrect"
      });
    }

    // ✅ Update PIN
    await vault.updatePin(newPin);

    console.log("✅ PIN updated successfully for user:", userId);

    res.json({
      success: true,
      message: "PIN updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating PIN:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update PIN",
      error: error.message
    });
  }
};

// ✅ Get Vault Status (Check if vault exists)
exports.getVaultStatus = async (req, res) => {
  console.log("📊 [GET VAULT STATUS] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;

    const vault = await Vault.findByFirebaseUID(userId);

    if (!vault || !vault.vaultCreated) {
      return res.json({
        success: true,
        vaultExists: false,
        message: "Vault not created yet"
      });
    }

    res.json({
      success: true,
      vaultExists: true,
      vault: {
        _id: vault._id,
        firebaseUID: vault.firebaseUID,
        fullName: vault.fullName,
        recoveryEmail: vault.recoveryEmail,
        vaultCreated: vault.vaultCreated,
        isActive: vault.isActive,
        createdAt: vault.createdAt,
        lastPinChange: vault.lastPinChange
      }
    });
  } catch (error) {
    console.error("❌ Error getting vault status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get vault status",
      error: error.message
    });
  }
};

// ✅ Request PIN Reset - Send verification code to recovery email
exports.requestPinReset = async (req, res) => {
  console.log("🔐 [REQUEST PIN RESET] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // ✅ Find vault
    const vault = await Vault.findByFirebaseUID(userId);
    if (!vault || !vault.vaultCreated) {
      return res.status(404).json({
        success: false,
        message: "Vault not found"
      });
    }

    // ✅ Verify email matches recovery email
    if (vault.recoveryEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Email does not match recovery email"
      });
    }

    // ✅ Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Delete any existing reset requests for this user
    await PinReset.deleteMany({ firebaseUID: userId, isUsed: false });

    // ✅ Create new reset request
    const pinReset = await PinReset.create({
      firebaseUID: userId,
      email: email.toLowerCase(),
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // ✅ TODO: Send email with verification code
    // For now, log it (in production, send email via nodemailer/sendgrid/etc)
    console.log("📧 Verification code for", email, ":", verificationCode);
    console.log("⚠️ In production, send this code via email service");

    // ✅ Development: Return code in response (remove in production)
    res.json({
      success: true,
      message: "Verification code sent to your recovery email",
      // ⚠️ Remove this in production - only for development
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });
  } catch (error) {
    console.error("❌ Error requesting PIN reset:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: error.message
    });
  }
};

// ✅ Verify Reset Code
exports.verifyResetCode = async (req, res) => {
  console.log("✅ [VERIFY RESET CODE] Request received");
  console.log("👤 User:", req.user.uid);

  try {
    const userId = req.user.uid;
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
    }

    // ✅ Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be 6 digits"
      });
    }

    // ✅ Find reset request
    const pinReset = await PinReset.findOne({
      firebaseUID: userId,
      email: email.toLowerCase(),
      verificationCode: code,
      expiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!pinReset) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // ✅ Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // ✅ Update reset request
    pinReset.resetToken = resetToken;
    pinReset.isVerified = true;
    pinReset.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for reset
    await pinReset.save();

    console.log("✅ Reset code verified successfully for user:", userId);

    res.json({
      success: true,
      message: "Verification code verified successfully",
      resetToken: resetToken
    });
  } catch (error) {
    console.error("❌ Error verifying reset code:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error.message
    });
  }
};

// ✅ Reset PIN with verification token
exports.resetPin = async (req, res) => {
  console.log("🔄 [RESET PIN] Request received");
  console.log("👤 User:", req.user.uid);
  console.log("📥 Request Body:", { 
    resetToken: req.body.resetToken ? "***" + req.body.resetToken.slice(-10) : "missing",
    newPin: req.body.newPin ? "****" : "missing",
    confirmPin: req.body.confirmPin ? "****" : "missing"
  });

  // ✅ Check if response already sent (prevent duplicate processing)
  if (res.headersSent) {
    console.log("⚠️ Response already sent, ignoring duplicate request");
    return;
  }

  try {
    const userId = req.user.uid;
    const { resetToken, newPin, confirmPin } = req.body;

    // ✅ Basic validation first (before deduplication)
    if (!resetToken) {
      console.log("❌ Missing resetToken");
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "Reset token is required"
        });
      }
      return;
    }

    // ✅ Request deduplication - check if same request is already processing
    const requestKey = `${userId}-${resetToken}`;
    if (activeRequests.has(requestKey)) {
      console.log("⚠️ Duplicate request detected, already processing");
      if (!res.headersSent) {
        return res.status(429).json({
          success: false,
          message: "Request already in progress. Please wait."
        });
      }
      return;
    }

    // ✅ Mark request as active
    activeRequests.set(requestKey, Date.now());

    // ✅ Auto-cleanup after timeout
    setTimeout(() => {
      activeRequests.delete(requestKey);
    }, REQUEST_TIMEOUT);

    // ✅ Additional validation checks
    if (!newPin) {
      console.log("❌ Missing newPin");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "New PIN is required"
        });
      }
      return;
    }

    if (!confirmPin) {
      console.log("❌ Missing confirmPin");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "Confirm PIN is required"
        });
      }
      return;
    }

    // ✅ Validate PIN format
    if (!/^\d{4}$/.test(newPin)) {
      console.log("❌ Invalid PIN format:", newPin);
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "New PIN must be exactly 4 digits"
        });
      }
      return;
    }

    // ✅ Check if PINs match
    if (newPin !== confirmPin) {
      console.log("❌ PIN mismatch");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "New PIN and confirm PIN do not match"
        });
      }
      return;
    }

    // ✅ Find reset request by token
    console.log("🔍 Looking for reset token...");
    const pinReset = await PinReset.findByResetToken(resetToken);

    if (!pinReset) {
      console.log("❌ Reset token not found or expired");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token"
        });
      }
      return;
    }

    console.log("✅ Reset token found for user:", pinReset.firebaseUID);

    // ✅ Verify user matches
    if (pinReset.firebaseUID !== userId) {
      console.log("❌ User mismatch. Token user:", pinReset.firebaseUID, "Request user:", userId);
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }
      return;
    }

    // ✅ Check if already used
    if (pinReset.isUsed) {
      console.log("❌ Reset token already used");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: "Reset token has already been used"
        });
      }
      return;
    }

    // ✅ Find vault
    console.log("🔍 Finding vault...");
    const vault = await Vault.findByFirebaseUID(userId);
    if (!vault || !vault.vaultCreated) {
      console.log("❌ Vault not found");
      activeRequests.delete(requestKey);
      if (!res.headersSent) {
        return res.status(404).json({
          success: false,
          message: "Vault not found"
        });
      }
      return;
    }

    // ✅ Update PIN
    console.log("📝 Updating PIN...");
    await vault.updatePin(newPin);

    // ✅ Mark reset request as used
    pinReset.isUsed = true;
    await pinReset.save();

    // ✅ Delete all other reset requests for this user
    await PinReset.deleteMany({ firebaseUID: userId, isUsed: false });

    console.log("✅ PIN reset successfully for user:", userId);

    // ✅ Cleanup active request
    activeRequests.delete(requestKey);

    // ✅ Check if response already sent
    if (!res.headersSent) {
      console.log("✅ Response sent successfully");
      return res.json({
        success: true,
        message: "PIN reset successfully"
      });
    }
  } catch (error) {
    console.error("❌ Error resetting PIN:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // ✅ Cleanup active request on error
    try {
      const requestKey = `${req.user?.uid || 'unknown'}-${req.body?.resetToken || 'unknown'}`;
      activeRequests.delete(requestKey);
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError.message);
    }
    
    // Ensure response is sent even on error
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to reset PIN",
        error: error.message
      });
    }
  }
};