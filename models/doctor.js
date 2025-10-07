const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  availableSlots: [{ type: String }], // optional legacy format
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

  // 📅 Weekly recurring schedule
  schedule: [
    {
      day: { type: String }, // "Monday"
      startTime: { type: String }, // "09:00"
      endTime: { type: String },   // "17:00"
      isAvailable: { type: Boolean, default: true }
    }
  ],

  // 📅 Extra calendar events (doctor vacations / blocked dates)
  calendar: [
    {
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
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
