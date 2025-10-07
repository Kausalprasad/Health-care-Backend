const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  
  // ✅ Firebase UID ke liye String use karo, ObjectId nahi
  patientId: { type: String, required: true }, // Firebase UID (String format)
  
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  hospitalName: { type: String, required: true }, // snapshot from doctor.hospitalName
  fees: { type: Number, required: true }, // snapshot from doctor.fees

  // 📅 Calendar fields
  date: { type: Date, required: true },   // appointment date
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true },   // "10:30"

  status: { type: String, enum: ["booked", "completed", "cancelled"], default: "booked" }
}, { timestamps: true });

// Index for faster calendar queries
bookingSchema.index({ doctorId: 1, date: 1 });
// ✅ Index for user's bookings
bookingSchema.index({ patientId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);