// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  getBookings,
  cancelBooking,
  rescheduleBooking
} = require("../controllers/bookingController");

router.post("/", bookAppointment);                 // Book new appointment
router.get("/", getBookings);                      // Get bookings
router.delete("/:bookingId", cancelBooking);       // Cancel booking
router.put("/:bookingId/reschedule", rescheduleBooking); // Reschedule booking

module.exports = router;
