const express = require("express");
const Doctor = require("../models/doctor");
const Booking = require("../models/booking");

const router = express.Router();

// 🔹 GET all doctors
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find();

    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔹 POST a new booking
router.post("/bookings", async (req, res) => {
  try {
    const { doctorId, patientName, patientEmail, patientId, date, startTime, endTime } = req.body;

    // doctor fetch
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // schema ke hisaab se booking create
    const booking = new Booking({
      doctorId,
      patientId,
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      date,
      startTime,
      endTime
    });

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;