const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const authMiddleware = require('../middlewares/authMiddleware');
// Routes (sab Firebase Auth protected)
router.post("/", authMiddleware, patientController.addPatient);
router.get("/", authMiddleware, patientController.getPatients);
router.get("/:id", authMiddleware, patientController.getPatientById);
router.put("/:id", authMiddleware, patientController.updatePatient);
router.delete("/:id", authMiddleware, patientController.deletePatient);

module.exports = router;
