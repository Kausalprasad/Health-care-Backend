const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  availableSlots: [{ type: String }], // Format: "YYYY-MM-DD HH:mm-HH:mm"
  fees: { type: Number, default: 500 },
  location: { type: String, default: "Delhi" },
  rating: { type: Number, default: 4.0, min: 1, max: 5 },
  bio: { type: String },
  phone: { type: String },
  email: { type: String },
  profilePicture: { type: String },
  hospitalName: { type: String },
  qualifications: [{ type: String }],
  languages: [{ type: String }],
  verified: { type: Boolean, default: true },
  schedule: [
    {
      day: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      isAvailable: { type: Boolean, default: true }
    }
  ]
}, { timestamps: true });

doctorSchema.index({
  name: 'text',
  specialization: 'text',
  location: 'text',
  bio: 'text'
});

module.exports = mongoose.model("Doctor", doctorSchema);
