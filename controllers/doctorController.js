const Doctor = require("../models/doctor");
const Booking = require("../models/booking");

// Get all doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search and filter doctors
const searchDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      minExperience,
      maxFees,
      rating,
      location,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    let query = {};

    // Text search
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (specialization) query.specialization = { $regex: specialization, $options: "i" };
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (maxFees) query.fees = { $lte: parseInt(maxFees) };
    if (rating) query.rating = { $gte: parseFloat(rating) };
    if (location) query.location = { $regex: location, $options: "i" };

    // Sort
    let sort = {};
    if (sortBy === "fees") sort.fees = sortOrder === "asc" ? 1 : -1;
    else if (sortBy === "rating") sort.rating = sortOrder === "asc" ? 1 : -1;
    else if (sortBy === "experience") sort.experience = sortOrder === "asc" ? 1 : -1;
    else sort.name = sortOrder === "asc" ? 1 : -1;

    const doctors = await Doctor.find(query).sort(sort);

    res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error searching doctors", error: error.message });
  }
};

// Get all unique specializations
const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct("specialization");
    res.json({ success: true, specializations: specializations.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching specializations" });
  }
};

// Get all unique locations
const getLocations = async (req, res) => {
  try {
    const locations = await Doctor.distinct("location");
    res.json({ success: true, locations: locations.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching locations" });
  }
};
const getSlotsByDate = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const date = req.query.date; // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: "Date is required" });

    // Get day of week in same format as schema ("Monday", "Tuesday")
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const scheduleForDay = doctor.schedule.find(s => s.day === dayOfWeek && s.isAvailable);

    let slots = [];
    if (scheduleForDay) {
      let [hour, min] = scheduleForDay.startTime.split(":").map(Number);
      const [endHour, endMin] = scheduleForDay.endTime.split(":").map(Number);

      while (hour < endHour || (hour === endHour && min < endMin)) {
        const slotStart = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        min += 30;
        if (min >= 60) { hour += 1; min -= 60; }
        const slotEnd = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(`${slotStart}-${slotEnd}`);
      }
    } else {
      slots = doctor.availableSlots || [];
    }

    // Fetch booked slots for that doctor on that date
    const bookings = await Booking.find({ doctorId: doctor._id, date: new Date(date) });

    const bookedSlots = bookings.map(b => `${b.startTime}-${b.endTime}`);
    slots = slots.filter(s => !bookedSlots.includes(s));

    res.json({ availableSlots: slots });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


module.exports = { getDoctors, getDoctorById, searchDoctors, getSpecializations, getLocations, getSlotsByDate };
