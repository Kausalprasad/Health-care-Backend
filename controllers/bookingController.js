// controllers/bookingController.js
const Booking = require("../models/booking");
const Doctor = require("../models/doctor");

// ✅ Book an appointment (uses req.user.uid from auth middleware)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientName, patientEmail, date, startTime, endTime } = req.body;
    const userId = req.user.uid; // ✅ Get authenticated user's UID

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check if slot already booked
    const existing = await Booking.findOne({ 
      doctorId, 
      date: new Date(date), 
      startTime, 
      endTime 
    });
    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // ✅ Create booking with authenticated user's UID
    const booking = await Booking.create({
      doctorId,
      patientId: userId, // ✅ Use Firebase UID
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      date,
      startTime,
      endTime,
    });

    res.status(201).json({ message: "Booking successful", booking });
    console.log("✅ Booking saved for user:", userId);
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
};

// ✅ Get bookings for authenticated user (uses req.user.uid)
exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.uid; // ✅ Get authenticated user's UID

    // ✅ Fetch only bookings for this user
    const bookings = await Booking.find({ patientId: userId })
      .populate("doctorId", "name specialization profilePicture")
      .sort({ date: 1, startTime: 1 }); // Sort by date and time

    res.json(bookings);
    console.log(`✅ Fetched ${bookings.length} bookings for user:`, userId);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
};

// ✅ Cancel booking (with ownership check)
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.uid; // ✅ Get authenticated user's UID

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Verify user owns this booking
    if (booking.patientId !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only cancel your own bookings" });
    }

    await Booking.findByIdAndDelete(bookingId);

    res.json({ message: "Booking cancelled successfully" });
    console.log("✅ Booking cancelled:", bookingId);
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Error cancelling booking", error: err.message });
  }
};

// ✅ Reschedule booking (with ownership check)
exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, newStartTime, newEndTime } = req.body;
    const userId = req.user.uid; // ✅ Get authenticated user's UID

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Verify user owns this booking
    if (booking.patientId !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only reschedule your own bookings" });
    }

    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if new slot is already booked
    const existing = await Booking.findOne({
      doctorId: booking.doctorId,
      date: new Date(newDate),
      startTime: newStartTime,
      endTime: newEndTime,
      _id: { $ne: bookingId } // Exclude current booking
    });

    if (existing) {
      return res.status(400).json({ message: "New slot not available" });
    }

    // Update booking
    booking.date = newDate;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;
    await booking.save();

    res.json({ message: "Booking rescheduled successfully", booking });
    console.log("✅ Booking rescheduled:", bookingId);
  } catch (err) {
    console.error("Reschedule booking error:", err);
    res.status(500).json({ message: "Error rescheduling booking", error: err.message });
  }
};