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
    const { doctorId, patientName, patientEmail, slot } = req.body;

    // doctor ka record nikalna
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // booking banani hai doctor ki details copy karke
    const booking = new Booking({
      doctorId: doctor._id,
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName || "N/A",
      fees: doctor.fees,
      slot
    });

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
