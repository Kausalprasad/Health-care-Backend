// controllers/bookingController.js
const Booking = require("../models/booking");
const Doctor = require("../models/doctor");

// =========================================================
// 📌 Book Appointment
// =========================================================
exports.bookAppointment = async (req, res) => {
  console.log("📩 [BOOK REQUEST RECEIVED] Body:", req.body);
  console.log("👤 Authenticated user:", req.user);

  try {
    const { doctorId, patientName, patientEmail, date, startTime, endTime } = req.body;
    const userId = req.user.uid;

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

    console.log("🆕 Creating booking for user:", userId);

    const booking = await Booking.create({
      doctorId,
      patientId: userId,
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      date,
      startTime,
      endTime,
    });

    console.log("✅ Booking created successfully:", booking._id);

    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("🚨 Booking error:", err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
};

// =========================================================
// 📌 Get Bookings (For Specific User Only)
// =========================================================
exports.getBookings = async (req, res) => {
  console.log("📩 [GET BOOKINGS] User:", req.user.uid);

  try {
    const userId = req.user.uid;

    console.log("🔍 Fetching bookings for:", userId);

    const bookings = await Booking.find({ patientId: userId })
      .populate("doctorId", "name specialization profilePicture")
      .sort({ date: 1, startTime: 1 });

    console.log(`📦 ${bookings.length} bookings found for user:`, userId);

    res.json(bookings);
  } catch (err) {
    console.error("🚨 Get bookings error:", err);
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
};

// =========================================================
// 📌 Cancel Booking
// =========================================================
exports.cancelBooking = async (req, res) => {
  console.log("📩 [CANCEL REQUEST] Params:", req.params, "User:", req.user.uid);

  try {
    const { bookingId } = req.params;
    const userId = req.user.uid;

    console.log("🔍 Checking booking:", bookingId);

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("🔐 Checking ownership…");
    if (booking.patientId !== userId) {
      console.log("⛔ Unauthorized cancel attempt by:", userId);
      return res.status(403).json({ message: "Unauthorized: You can only cancel your own bookings" });
    }

    console.log("🗑️ Deleting booking:", bookingId);
    await Booking.findByIdAndDelete(bookingId);

    console.log("✅ Booking cancelled:", bookingId);

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("🚨 Cancel booking error:", err);
    res.status(500).json({ message: "Error cancelling booking", error: err.message });
  }
};

// =========================================================
// 📌 Reschedule Booking
// =========================================================
exports.rescheduleBooking = async (req, res) => {
  console.log("📩 [RESCHEDULE REQUEST] Params:", req.params, "Body:", req.body);

  try {
    const { bookingId } = req.params;
    const { newDate, newStartTime, newEndTime } = req.body;
    const userId = req.user.uid;

    console.log("🔍 Fetching existing booking:", bookingId);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("🔐 Checking ownership…");
    if (booking.patientId !== userId) {
      console.log("⛔ Unauthorized reschedule attempt by:", userId);
      return res.status(403).json({ message: "Unauthorized: You can only reschedule your own bookings" });
    }

    console.log("🔍 Checking doctor info:", booking.doctorId);
    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) {
      console.log("❌ Doctor not found:", booking.doctorId);
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log("⏳ Checking for conflicting bookings…");

    const existing = await Booking.findOne({
      doctorId: booking.doctorId,
      date: new Date(newDate),
      startTime: newStartTime,
      endTime: newEndTime,
      _id: { $ne: bookingId }
    });

    if (existing) {
      console.log("⚠️ New slot not available:", { newDate, newStartTime, newEndTime });
      return res.status(400).json({ message: "New slot not available" });
    }

    console.log("♻️ Updating booking…");

    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    await booking.save();

    console.log("✅ Booking rescheduled:", bookingId);

    res.json({ message: "Booking rescheduled successfully", booking });
  } catch (err) {
    console.error("Reschedule booking error:", err);
    res.status(500).json({ message: "Error rescheduling booking", error: err.message });
  }
};