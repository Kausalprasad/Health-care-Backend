const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  searchDoctors,
  getSpecializations,
  getLocations,
    getSlotsByDate,
} = require("../controllers/doctorController");

router.get("/", getDoctors);
router.get("/:id", getDoctorById);
router.get("/:id/slots", getSlotsByDate);


// Search and filter
router.get("/search/doctors", searchDoctors);
router.get("/filter/specializations", getSpecializations);
router.get("/filter/locations", getLocations);


module.exports = router;
