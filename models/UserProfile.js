const mongoose = require('mongoose');

// User Profile Schema for Healthcare App
const userProfileSchema = new mongoose.Schema({
  // Firebase Auth Integration
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Step 1: Basic Info
  basicInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    age: {
      type: Number,
      // Auto-calculated from DOB
      get: function() {
        if (this.basicInfo.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(this.basicInfo.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        }
        return null;
      }
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      required: true
    },
     bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
    profilePhoto: {
      url: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    patientID: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness if provided
      trim: true
    }
  },

  // Contact Information
  contactInfo: {
    primaryPhone: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[+]?[1-9][\d]{1,14}$/.test(v); // Basic international phone validation
        },
        message: 'Please enter a valid phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    }
  },

  // Step 2: Emergency Details
  emergencyContact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    relationship: {
      type: String,
      enum: ['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Caregiver', 'Other'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[+]?[1-9][\d]{1,14}$/.test(v);
        },
        message: 'Please enter a valid emergency contact phone number'
      }
    },
    enableSMS: {
      type: Boolean,
      default: true
    },
    enableCall: {
      type: Boolean,
      default: true
    }
  },

  // Step 3: Medical Conditions
  medicalConditions: [{
    conditionName: {
      type: String,
      required: true,
      trim: true
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved'],
      default: 'Active'
    },
    diagnosedDate: Date,
    notes: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Allergies
  allergies: [{
    allergenName: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      required: true
    },
    severityIcon: {
      type: String,
      get: function() {
        switch(this.severity) {
          case 'Severe': return '🚨';
          case 'Moderate': return '⚠️';
          case 'Mild': return '⚡';
          default: return '';
        }
      }
    },
    reaction: {
      type: String,
      trim: true
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Medications (Optional Initial Setup)
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      enum: ['Once Daily', 'Twice Daily', 'Three Times Daily', 'Four Times Daily', 'As Needed', 'Weekly', 'Monthly', 'Custom']
    },
    timing: [{
      type: String,
      trim: true
      // e.g., "Morning", "After Meal", "Before Bed"
    }],
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String,
    addedBy: {
      type: String,
      enum: ['Patient', 'Caregiver', 'Doctor'],
      default: 'Patient'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Profile Completion Status
  profileCompletion: {
    step1Completed: {
      type: Boolean,
      default: false
    },
    step2Completed: {
      type: Boolean,
      default: false
    },
    step3Completed: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Account Settings
  settings: {
    notifications: {
      medication: {
        type: Boolean,
        default: true
      },
      appointment: {
        type: Boolean,
        default: true
      },
      emergency: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      shareWithCaregivers: {
        type: Boolean,
        default: true
      },
      shareWithDoctors: {
        type: Boolean,
        default: true
      }
    }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    getters: true 
  },
  toObject: { 
    virtuals: true,
    getters: true 
  }
});

// Indexes for better performance
userProfileSchema.index({ firebaseUID: 1 });
userProfileSchema.index({ 'basicInfo.patientID': 1 });
userProfileSchema.index({ 'contactInfo.primaryPhone': 1 });
userProfileSchema.index({ createdAt: -1 });

// Pre-save middleware to update completion percentage
userProfileSchema.pre('save', function(next) {
  let completedSteps = 0;
  
  // Check Step 1 completion
  if (this.basicInfo.fullName && 
      this.basicInfo.dateOfBirth && 
      this.basicInfo.gender && 
      this.basicInfo.bloodGroup &&
      this.contactInfo.primaryPhone) {
    this.profileCompletion.step1Completed = true;
    completedSteps++;
  }
  
  // Check Step 2 completion
  if (this.emergencyContact.name && 
      this.emergencyContact.relationship && 
      this.emergencyContact.phoneNumber) {
    this.profileCompletion.step2Completed = true;
    completedSteps++;
  }
  
  // Check Step 3 completion (optional but adds to completion)
  if (this.medicalConditions.length > 0 || 
      this.allergies.length > 0 || 
      this.medications.length > 0) {
    this.profileCompletion.step3Completed = true;
    completedSteps++;
  }
  
  this.profileCompletion.completionPercentage = Math.round((completedSteps / 3) * 100);
  this.updatedAt = Date.now();
  
  next();
});

// Static method to find user by Firebase UID
userProfileSchema.statics.findByFirebaseUID = function(firebaseUID) {
  return this.findOne({ firebaseUID: firebaseUID });
};

// Instance method to add medical condition
userProfileSchema.methods.addMedicalCondition = function(condition) {
  this.medicalConditions.push(condition);
  return this.save();
};

// Instance method to add allergy
userProfileSchema.methods.addAllergy = function(allergy) {
  this.allergies.push(allergy);
  return this.save();
};

// Instance method to add medication
userProfileSchema.methods.addMedication = function(medication) {
  this.medications.push(medication);
  return this.save();
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;