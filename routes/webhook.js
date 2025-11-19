const express = require("express");
const Doctor = require("../models/doctor");
const Booking = require("../models/booking");

const router = express.Router();

// 🔹 GET all doctors
router.get("/doctors", async (req, res) => {
  console.log("📌 GET /doctors called");

  try {
    const doctors = await Doctor.find();

    console.log(`✅ Doctors fetched: ${doctors.length} found`);

    res.json({ success: true, doctors });
  } catch (err) {
    console.error("❌ Error fetching doctors:", err.message);

    res.status(500).json({ success: false, error: err.message });
  }
});


// 🔹 POST a new booking
router.post("/bookings", async (req, res) => {
  console.log("📌 POST /bookings called");
  console.log("📥 Incoming booking data:", req.body);

  try {
    const { doctorId, patientName, patientEmail, patientId, date, startTime, endTime } = req.body;

    // doctor fetch
    console.log(`🔍 Fetching doctor with ID: ${doctorId}`);

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      console.warn(`⚠️ Doctor not found for ID: ${doctorId}`);
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    console.log("✅ Doctor found:", { name: doctor.name, hospital: doctor.hospitalName });

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

    console.log("📝 Creating booking with data:", booking);

    await booking.save();

    console.log("✅ Booking saved successfully!");

    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error creating booking:", err.message);

    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;