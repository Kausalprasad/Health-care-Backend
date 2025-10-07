// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  bookAppointment,
  getBookings,
  cancelBooking,
  rescheduleBooking
} = require("../controllers/bookingController");

// ✅ All booking routes require authentication
router.post("/", authMiddleware, bookAppointment);                 // Book new appointment
router.get("/", authMiddleware, getBookings);                      // Get bookings
router.delete("/:bookingId", authMiddleware, cancelBooking);       // Cancel booking
router.put("/:bookingId/reschedule", authMiddleware, rescheduleBooking); // Reschedule booking

module.exports = router;