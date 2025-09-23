const mongoose = require('mongoose');

// Helper to parse dates safely
const parseDate = dateStr => dateStr ? new Date(dateStr) : undefined;

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  // Firebase UID
  firebaseUID: { type: String, required: true, unique: true, index: true },

  // Step 1: Basic Info
  basicInfo: {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    age: {
      type: Number,
      get() {
        if (this.basicInfo.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(this.basicInfo.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
          return age;
        }
        return null;
      }
    },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    profilePhoto: {
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now }
    },
    patientID: { type: String, unique: true, sparse: true, trim: true }
  },

  // Contact Info
  contactInfo: {
    primaryPhone: {
      type: String,
      required: true,
      validate: {
        validator: v => /^[+]?[1-9][\d]{1,14}$/.test(v),
        message: 'Please enter a valid phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
        message: 'Please enter a valid email address'
      }
    }
  },

  // Step 2: Emergency Contact (Optional in schema, validated in controller)
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, enum: ['Spouse','Child','Parent','Sibling','Friend','Caregiver','Other'] },
    phoneNumber: {
      type: String,
      validate: {
        validator: v => !v || /^[+]?[1-9][\d]{1,14}$/.test(v),
        message: 'Please enter a valid phone number'
      }
    },
    enableSMS: { type: Boolean, default: true },
    enableCall: { type: Boolean, default: true }
  },

  // Step 3: Medical Info
  medicalConditions: [{
    conditionName: { type: String, required: true, trim: true },
    isCustom: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
    diagnosedDate: Date,
    notes: String,
    addedAt: { type: Date, default: Date.now }
  }],
  allergies: [{
    allergenName: { type: String, required: true, trim: true },
    severity: { type: String, enum: ['Mild','Moderate','Severe'], required: true },
    severityIcon: {
      type: String,
      get() {
        switch(this.severity){
          case 'Severe': return '🚨';
          case 'Moderate': return '⚠️';
          case 'Mild': return '⚡';
          default: return '';
        }
      }
    },
    reaction: { type: String, trim: true },
    isCustom: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
  }],
  medications: [{
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { 
      type: String, 
      required: true, 
      enum: ['Once Daily','Twice Daily','Three Times Daily','Four Times Daily','As Needed','Weekly','Monthly','Custom'] 
    },
    timing: [{ type: String, trim: true }],
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true },
    notes: String,
    addedBy: { type: String, enum: ['Patient','Caregiver','Doctor'], default: 'Patient' },
    addedAt: { type: Date, default: Date.now }
  }],

  // Profile Completion
  profileCompletion: {
    step1Completed: { type: Boolean, default: false },
    step2Completed: { type: Boolean, default: false },
    step3Completed: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },

  // Account Settings
  settings: {
    notifications: {
      medication: { type: Boolean, default: true },
      appointment: { type: Boolean, default: true },
      emergency: { type: Boolean, default: true }
    },
    privacy: {
      shareWithCaregivers: { type: Boolean, default: true },
      shareWithDoctors: { type: Boolean, default: true }
    }
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },

  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }

}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

// Indexes
userProfileSchema.index({ firebaseUID: 1 });
userProfileSchema.index({ 'basicInfo.patientID': 1 });
userProfileSchema.index({ 'contactInfo.primaryPhone': 1 });
userProfileSchema.index({ createdAt: -1 });

// Pre-save: Update completion %
userProfileSchema.pre('save', function(next){
  let completedSteps = 0;

  // Step 1
  if(this.basicInfo.fullName && this.basicInfo.dateOfBirth && this.basicInfo.gender && this.basicInfo.bloodGroup && this.contactInfo.primaryPhone){
    this.profileCompletion.step1Completed = true;
    completedSteps++;
  } else { this.profileCompletion.step1Completed = false; }

  // Step 2
  if(this.emergencyContact && this.emergencyContact.name && this.emergencyContact.relationship && this.emergencyContact.phoneNumber){
    this.profileCompletion.step2Completed = true;
    completedSteps++;
  } else { this.profileCompletion.step2Completed = false; }

  // Step 3
  if((this.medicalConditions && this.medicalConditions.length>0) || (this.allergies && this.allergies.length>0) || (this.medications && this.medications.length>0)){
    this.profileCompletion.step3Completed = true;
    completedSteps++;
  } else { this.profileCompletion.step3Completed = false; }

  this.profileCompletion.completionPercentage = Math.round((completedSteps/3)*100);
  this.updatedAt = Date.now();

  next();
});

// Static & Instance Methods
userProfileSchema.statics.findByFirebaseUID = function(firebaseUID){
  return this.findOne({ firebaseUID });
};

userProfileSchema.methods.addMedicalCondition = function(condition){ this.medicalConditions.push(condition); return this.save(); };
userProfileSchema.methods.addAllergy = function(allergy){ this.allergies.push(allergy); return this.save(); };
userProfileSchema.methods.addMedication = function(medication){ this.medications.push(medication); return this.save(); };

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;

console.log('✅ UserProfile schema ready & optimized');
