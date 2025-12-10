const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vaultSchema = new mongoose.Schema({
  // ✅ Link to Firebase UID
  firebaseUID: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },

  // ✅ User's Full Name
  fullName: { 
    type: String, 
    required: true, 
    trim: true 
  },

  // ✅ PIN (4 digits) - Hashed
  pinHash: { 
    type: String, 
    required: true 
  },

  // ✅ Recovery Email
  recoveryEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
      message: 'Please enter a valid email address'
    }
  },

  // ✅ Vault Status
  isActive: { 
    type: Boolean, 
    default: true 
  },

  // ✅ Vault Created
  vaultCreated: { 
    type: Boolean, 
    default: false 
  },

  // ✅ Last PIN Change
  lastPinChange: { 
    type: Date, 
    default: Date.now 
  },

  // ✅ Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.pinHash; // Never send PIN hash to client
      return ret;
    }
  }
});

// ✅ Index for faster lookups
vaultSchema.index({ firebaseUID: 1 });
vaultSchema.index({ recoveryEmail: 1 });

// ✅ Method: Hash PIN before saving
vaultSchema.pre('save', async function(next) {
  // Only hash PIN if it's modified and not already hashed
  if (!this.isModified('pinHash')) {
    return next();
  }

  // Hash the PIN
  try {
    const salt = await bcrypt.genSalt(10);
    this.pinHash = await bcrypt.hash(this.pinHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Method: Compare PIN
vaultSchema.methods.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pinHash);
  } catch (error) {
    return false;
  }
};

// ✅ Method: Update PIN
vaultSchema.methods.updatePin = async function(newPin) {
  this.pinHash = newPin; // Will be hashed by pre-save hook
  this.lastPinChange = new Date();
  return this.save();
};

// ✅ Static: Find by Firebase UID
vaultSchema.statics.findByFirebaseUID = function(firebaseUID) {
  return this.findOne({ firebaseUID });
};

const Vault = mongoose.model('Vault', vaultSchema);

module.exports = Vault;