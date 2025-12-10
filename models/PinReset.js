const mongoose = require('mongoose');

const pinResetSchema = new mongoose.Schema({
  // ✅ Link to Firebase UID
  firebaseUID: { 
    type: String, 
    required: true, 
    index: true 
  },

  // ✅ Recovery Email
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },

  // ✅ Verification Code (6 digits)
  verificationCode: { 
    type: String, 
    required: true 
  },

  // ✅ Reset Token (after code verification)
  resetToken: { 
    type: String 
  },

  // ✅ Token Expiry (10 minutes)
  expiresAt: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },

  // ✅ Status
  isVerified: { 
    type: Boolean, 
    default: false 
  },

  // ✅ Used status
  isUsed: { 
    type: Boolean, 
    default: false 
  },

  // ✅ Created At
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// ✅ Index for faster lookups
pinResetSchema.index({ firebaseUID: 1 });
pinResetSchema.index({ email: 1 });
pinResetSchema.index({ resetToken: 1 });
pinResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes

// ✅ Static: Find active reset by Firebase UID
pinResetSchema.statics.findActiveByFirebaseUID = function(firebaseUID) {
  return this.findOne({ 
    firebaseUID, 
    expiresAt: { $gt: new Date() },
    isUsed: false
  }).sort({ createdAt: -1 });
};

// ✅ Static: Find by reset token
pinResetSchema.statics.findByResetToken = function(resetToken) {
  return this.findOne({ 
    resetToken, 
    expiresAt: { $gt: new Date() },
    isVerified: true,
    isUsed: false
  });
};

const PinReset = mongoose.model('PinReset', pinResetSchema);

module.exports = PinReset;