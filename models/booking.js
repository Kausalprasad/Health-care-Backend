const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // 🔄 Doctor ID ko String kar diya
  doctorId: { type: String, required: true },

  // 🔥 Firebase UID Patient ID already String hai
  patientId: { type: String, required: true },

  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  hospitalName: { type: String, required: true },
  fees: { type: Number, required: true },

  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  status: { type: String, enum: ["booked", "completed", "cancelled"], default: "booked" }
}, { timestamps: true });

// Index for faster calendar queries
bookingSchema.index({ doctorId: 1, date: 1 });

// Index for user's bookings
bookingSchema.index({ patientId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
