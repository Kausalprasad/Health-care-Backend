// controllers/bookingController.js
const Booking = require("../models/booking");
const Doctor = require("../models/doctor");

// ✅ Book an appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientName, patientEmail, slot, patientId } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // check if slot available
    if (!doctor.availableSlots.includes(slot)) {
      return res.status(400).json({ message: "Slot not available" });
    }

    // ✅ Copy fees & hospitalName at booking time
    const booking = await Booking.create({
      doctorId,
      patientId: patientId || null,
      patientName,
      patientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      slot,
    });

    // remove booked slot from doctor
    doctor.availableSlots = doctor.availableSlots.filter(s => s !== slot);
    await doctor.save();

    res.status(201).json({ message: "Booking successful", booking });
    console.log("✅ Booking saved:", booking);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
};

// ✅ Get bookings (user-specific)
exports.getBookings = async (req, res) => {
  try {
    const email = req.query.email;

    let bookings;
    if (email) {
      bookings = await Booking.find({ patientEmail: email })
        .populate("doctorId", "name specialization");
    } else {
      bookings = await Booking.find()
        .populate("doctorId", "name specialization");
    }

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
};

// ✅ Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Restore slot back to doctor
    const doctor = await Doctor.findById(booking.doctorId);
    if (doctor) {
      doctor.availableSlots.push(booking.slot);
      await doctor.save();
    }

    await Booking.findByIdAndDelete(bookingId);
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling booking", error: err.message });
  }
};

// ✅ Reschedule booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newSlot } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (!doctor.availableSlots.includes(newSlot)) {
      return res.status(400).json({ message: "Slot not available" });
    }

    // Restore old slot
    doctor.availableSlots.push(booking.slot);
    // Remove new slot
    doctor.availableSlots = doctor.availableSlots.filter(s => s !== newSlot);
    await doctor.save();

    // Update booking slot
    booking.slot = newSlot;
    await booking.save();

    res.json({ message: "Booking rescheduled successfully", booking });
  } catch (err) {
    res.status(500).json({ message: "Error rescheduling booking", error: err.message });
  }
};
