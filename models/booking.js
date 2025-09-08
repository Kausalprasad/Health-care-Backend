const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional agar user login h
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  hospitalName: { type: String, required: true }, // doctor.hospitalName copy at booking time
  fees: { type: Number, required: true }, // doctor.fees copy at booking time
  slot: { type: String, required: true }, // e.g. "2025-09-01 10:00"
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
