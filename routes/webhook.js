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


// 🔹 POST a new booking (same as bookingController but with auto-generated patientId)
router.post("/bookings", async (req, res) => {
  console.log("📩 [BOOK REQUEST RECEIVED] Body:", req.body);

  try {
    const { doctorId, patientName, patientEmail, date, startTime, endTime } = req.body;

    console.log("🔍 Checking doctor:", doctorId);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log("❌ Doctor not found:", doctorId);
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log("⏳ Checking slot availability:");

    const existing = await Booking.findOne({
      doctorId,
      date: new Date(date),
      startTime,
      endTime
    });

    if (existing) {
      console.log("⚠️ Slot already booked:", { date, startTime, endTime });
      return res.status(400).json({ message: "Slot already booked" });
    }

    // ✅ Generate random Firebase-like UID for patientId (webhook doesn't have auth)
    const generateRandomPatientId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 28; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const generatedPatientId = generateRandomPatientId();
    console.log("🆕 Creating booking with generated patientId:", generatedPatientId);

    const booking = await Booking.create({
      doctorId,
      patientId: generatedPatientId, // ✅ Auto-generated patientId
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      date,
      startTime,
      endTime,
    });

    // ✅ Populate doctor info for response
    await booking.populate("doctorId", "name specialization profilePicture hospitalName fees email phone");

    console.log("✅ Booking created successfully:", booking._id);

    // ✅ Return booking with proper doctorId and patientId structure
    const formattedBooking = {
      _id: booking._id,
      doctorId: booking.doctorId ? {
        _id: booking.doctorId._id, // ✅ Doctor ID
        name: booking.doctorId.name,
        specialization: booking.doctorId.specialization,
        profilePicture: booking.doctorId.profilePicture,
        hospitalName: booking.doctorId.hospitalName,
        fees: booking.doctorId.fees,
        email: booking.doctorId.email,
        phone: booking.doctorId.phone
      } : booking.doctorId,
      patientId: booking.patientId, // ✅ Patient ID (auto-generated)
      patientName: booking.patientName,
      patientEmail: booking.patientEmail,
      hospitalName: booking.hospitalName,
      fees: booking.fees,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };

    res.status(201).json({ message: "Booking successful", booking: formattedBooking });
  } catch (err) {
    console.error("🚨 Booking error:", err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
});

// 🔹 GET all bookings (with doctorId and patientId properly formatted)
router.get("/bookings", async (req, res) => {
  console.log("📩 [GET BOOKINGS] Query:", req.query);

  try {
    const { patientId } = req.query;

    // Build query - filter by patientId if provided
    const query = patientId ? { patientId } : {};

    console.log("🔍 Fetching bookings with query:", query);

    const bookings = await Booking.find(query)
      .populate("doctorId", "name specialization profilePicture hospitalName fees email phone")
      .sort({ date: 1, startTime: 1 });

    console.log(`📦 ${bookings.length} bookings found`);

    // ✅ Format bookings with proper doctorId and patientId structure
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      doctorId: booking.doctorId ? {
        _id: booking.doctorId._id, // ✅ Doctor ID
        name: booking.doctorId.name,
        specialization: booking.doctorId.specialization,
        profilePicture: booking.doctorId.profilePicture,
        hospitalName: booking.doctorId.hospitalName,
        fees: booking.doctorId.fees,
        email: booking.doctorId.email,
        phone: booking.doctorId.phone
      } : booking.doctorId,
      patientId: booking.patientId, // ✅ Patient ID
      patientName: booking.patientName,
      patientEmail: booking.patientEmail,
      hospitalName: booking.hospitalName,
      fees: booking.fees,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error("🚨 Get bookings error:", err);
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

module.exports = router;