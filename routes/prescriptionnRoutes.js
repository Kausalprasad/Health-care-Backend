const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  addPrescription,
  getPrescriptions,
  getPrescriptionById,
  deletePrescription
} = require("../controllers/prescriptionController");

router.post("/", authMiddleware, addPrescription);
router.get("/", authMiddleware, getPrescriptions);
router.get("/:id", authMiddleware, getPrescriptionById);
router.delete("/:id", authMiddleware, deletePrescription);

module.exports = router;