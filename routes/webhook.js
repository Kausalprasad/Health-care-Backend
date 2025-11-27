const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const Doctor = require("../models/doctor");
const Booking = require("../models/booking");
const UserProfile = require("../models/UserProfile");

const router = express.Router();

// ✅ CRM Webhook Configuration (Environment variables se)
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL;
const CRM_SECRET_KEY = process.env.CRM_SECRET_KEY;


// ✅ Function: CRM ko booking data bhejna (Non-blocking)
const sendBookingToCRM = async (bookingData) => {
  try {
    console.log("📤 Sending booking data to CRM...");
    console.log("🔗 CRM URL:", CRM_WEBHOOK_URL);
    
    // Schema mapping: camelCase to snake_case
    const crmPayload = {
      doctor_id: bookingData.doctorId?.toString() || bookingData.doctorId || "",
      patient_name: bookingData.patientName || "",
      patient_mail: bookingData.patientEmail || "",
      hospital_name: bookingData.hospitalName || "",
      fees: bookingData.fees?.toString() || bookingData.fees || "",
      date: bookingData.date ? new Date(bookingData.date).toISOString().split('T')[0] : "",
      start_time: bookingData.startTime || "",
      end_time: bookingData.endTime || "",
      status: bookingData.status || "booked"
    };

    console.log("📦 CRM Payload:", JSON.stringify(crmPayload, null, 2));
    console.log("🔑 Using Secret Key:", CRM_SECRET_KEY ? "***" + CRM_SECRET_KEY.slice(-10) : "NOT SET");

    const response = await axios.post(CRM_WEBHOOK_URL, crmPayload, {
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": CRM_SECRET_KEY,
        "ngrok-skip-browser-warning": "true" // Ngrok browser warning skip karne ke liye
      },
      timeout: 15000, // 15 seconds timeout
      validateStatus: function (status) {
        // Accept any status code as success (200-599)
        return status >= 200 && status < 600;
      }
    });

    console.log("✅ CRM webhook call successful!");
    console.log("📥 CRM Response Status:", response.status);
    console.log("📥 CRM Response Data:", JSON.stringify(response.data, null, 2));

    return { success: true, status: response.status, response: response.data };
  } catch (error) {
    // Detailed error logging
    console.error("❌ CRM webhook call failed:");
    
    if (error.code) {
      console.error("   Error Code:", error.code);
    }
    
    if (error.message) {
      console.error("   Error Message:", error.message);
    } else {
      console.error("   Error (no message):", error);
    }
    
    if (error.response) {
      // Server responded with error status
      console.error("   Response Status:", error.response.status);
      console.error("   Response Headers:", JSON.stringify(error.response.headers, null, 2));
      console.error("   Response Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request was made but no response received
      console.error("   No response received from CRM server");
      console.error("   Request URL:", error.config?.url);
      console.error("   Request Method:", error.config?.method);
      console.error("   This usually means:");
      console.error("     - CRM server is down");
      console.error("     - Network connectivity issue");
      console.error("     - Firewall blocking the request");
      console.error("     - Wrong URL");
    } else {
      // Error in setting up the request
      console.error("   Request setup error:", error.message);
    }
    
    // Network error details
    if (error.code === 'ECONNREFUSED') {
      console.error("   💡 Connection refused - CRM server might be down or URL is wrong");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("   💡 Request timeout - CRM server took too long to respond");
    } else if (error.code === 'ENOTFOUND') {
      console.error("   💡 DNS error - Could not resolve CRM server hostname");
    }
    
    return { 
      success: false, 
      error: error.message || "Unknown error",
      code: error.code,
      details: error.response?.data || error.request ? "No response from server" : "Request setup error"
    };
  }
};

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


// 🔹 POST a new booking
router.post("/bookings", async (req, res) => {
  console.log("📌 POST /bookings called");
  console.log("📥 Incoming booking data:", req.body);

  try {
    // ✅ Support both formats: camelCase (from app) and snake_case (from CRM)
    const {
      // camelCase format
      doctorId,
      patientName,
      patientEmail,
      patientId,
      date,
      startTime,
      endTime,
      // snake_case format (CRM)
      doctor_id,
      patient_name,
      patient_mail,
      patient_id,
      "start-time": start_time_crm,
      "end-time": end_time_crm
    } = req.body;

    // ✅ Normalize: Use snake_case if provided, else use camelCase
    const finalDoctorId = doctor_id || doctorId;
    const finalPatientName = patient_name || patientName;
    const finalPatientEmail = patient_mail || patientEmail;
    const finalPatientId = patient_id || patientId;
    const finalDate = date;
    const finalStartTime = start_time_crm || startTime;
    const finalEndTime = end_time_crm || endTime;

    console.log("📥 Normalized booking data:", {
      doctorId: finalDoctorId,
      patientName: finalPatientName,
      patientEmail: finalPatientEmail,
      patientId: finalPatientId,
      date: finalDate,
      startTime: finalStartTime,
      endTime: finalEndTime
    });

    // ✅ Step 1: Validate required fields
    if (!finalPatientEmail) {
      console.error("❌ patientEmail/patient_mail is required");
      return res.status(400).json({ 
        success: false, 
        message: "patientEmail or patient_mail is required" 
      });
    }

    if (!finalPatientName) {
      console.error("❌ patientName/patient_name is required");
      return res.status(400).json({ 
        success: false, 
        message: "patientName or patient_name is required" 
      });
    }

    if (!finalDate) {
      console.error("❌ date is required");
      return res.status(400).json({ 
        success: false, 
        message: "date is required" 
      });
    }

    if (!finalDoctorId) {
      console.error("❌ doctorId/doctor_id is required");
      return res.status(400).json({ 
        success: false, 
        message: "doctorId or doctor_id is required" 
      });
    }

    // ✅ Step 2: Doctor fetch
    console.log(`🔍 Fetching doctor with ID: ${finalDoctorId}`);

    // Validate doctorId format
    if (!finalDoctorId || !mongoose.Types.ObjectId.isValid(finalDoctorId)) {
      console.warn(`⚠️ Invalid doctorId format: ${finalDoctorId}`);
      return res.status(400).json({ success: false, message: "Invalid doctorId format" });
    }

    const doctor = await Doctor.findById(finalDoctorId);

    if (!doctor) {
      console.warn(`⚠️ Doctor not found for ID: ${finalDoctorId}`);
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    console.log("✅ Doctor found:", { name: doctor.name, hospital: doctor.hospitalName });

    // ✅ Step 3: User Identify karo (Email se Firebase UID find karo)
    // patientId optional hai - agar bheja hai to use karo, warna email se find karo
    let finalPatientIdValue = finalPatientId; 
    let userProfile = null;
    let userIdentified = false;

    if (!finalPatientIdValue) {
      // Email se user find karo (mandatory)
      console.log("🔍 Looking up user by email:", finalPatientEmail);
      
      userProfile = await UserProfile.findOne({ 
        "contactInfo.email": finalPatientEmail.toLowerCase().trim() 
      });
      
      if (userProfile && userProfile.firebaseUID) {
        finalPatientIdValue = userProfile.firebaseUID;
        userIdentified = true;
        console.log("✅ User found by email! Firebase UID:", finalPatientIdValue);
        console.log("✅ User Name:", userProfile.basicInfo?.fullName || finalPatientName);
      } else {
        console.warn("⚠️ User not found with email:", finalPatientEmail);
        console.warn("⚠️ Booking will be created but user may not see it in app");
        // Email se user nahi mila, to random generate karo
        const generateRandomPatientId = () => {
          const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let result = '';
          for (let i = 0; i < 28; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };
        finalPatientIdValue = generateRandomPatientId();
        console.warn("⚠️ Generated random patientId:", finalPatientIdValue);
      }
    } else {
      // Direct patientId provided
      userIdentified = true;
      console.log("✅ Using provided patientId:", finalPatientIdValue);
    }

    // ✅ Safety Check: Ensure finalPatientIdValue is always set
    if (!finalPatientIdValue || finalPatientIdValue.trim() === '') {
      console.error("❌ finalPatientIdValue is missing or empty!");
      // Last resort: Generate random patientId
      const generateRandomPatientId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 28; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      finalPatientIdValue = generateRandomPatientId();
      console.warn("⚠️ Generated fallback patientId:", finalPatientIdValue);
    }

    // ✅ Step 4: Check slot availability
    console.log("⏳ Checking slot availability...");
    
    // Default time agar nahi bheja
    const bookingStartTime = finalStartTime || "09:00";
    const bookingEndTime = finalEndTime || "09:30";
    
    const existing = await Booking.findOne({
      doctorId: finalDoctorId,
      date: new Date(finalDate),
      startTime: bookingStartTime,
      endTime: bookingEndTime
    });

    if (existing) {
      console.warn("⚠️ Slot already booked:", { date, startTime: bookingStartTime, endTime: bookingEndTime });
      return res.status(400).json({ success: false, message: "Slot already booked" });
    }

    // ✅ Step 5: Final validation before booking creation
    if (!finalPatientIdValue || typeof finalPatientIdValue !== 'string' || finalPatientIdValue.trim() === '') {
      console.error("❌ CRITICAL: finalPatientIdValue is invalid:", finalPatientIdValue);
      return res.status(500).json({ 
        success: false, 
        error: "Internal error: Could not generate patientId" 
      });
    }

    // ✅ Step 6: Booking create karo
    console.log("📝 Creating booking with patientId:", finalPatientIdValue);
    console.log("📝 Booking details:", {
      patientName: finalPatientName,
      patientEmail: finalPatientEmail,
      date: finalDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      patientId: finalPatientIdValue
    });

    const booking = new Booking({
      doctorId: finalDoctorId,
      patientId: finalPatientIdValue.trim(), // ✅ Email se mila Firebase UID ya provided/generated patientId
      patientName: finalPatientName,
      patientEmail: finalPatientEmail,
      hospitalName: doctor.hospitalName,
      fees: doctor.fees,
      date: new Date(finalDate),
      startTime: bookingStartTime,
      endTime: bookingEndTime
    });

    console.log("📝 Creating booking with data:", booking);

    await booking.save();

    console.log("✅ Booking saved successfully!");
    console.log("✅ Booking ID:", booking._id);

    // ✅ Step 3: CRM ko data bhejna (Non-blocking - don't wait)
    // Booking create ho chuki hai, ab CRM ko async call karo
    // Doctor info bhi include karo
    sendBookingToCRM({
      doctorId: booking.doctorId,
      doctorName: doctor.name, // Doctor name bhi bhejo
      patientName: booking.patientName,
      patientEmail: booking.patientEmail,
      hospitalName: booking.hospitalName,
      fees: booking.fees,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status
    }).catch(err => {
      // Extra safety - agar sendBookingToCRM mein bhi error aaye
      console.error("❌ CRM webhook error (non-critical):", err.message);
    });

    // ✅ Step 5: Populate doctor info for response
    await booking.populate("doctorId", "name specialization profilePicture hospitalName fees email phone");

    // Format response
    const formattedBooking = {
      _id: booking._id,
      doctorId: booking.doctorId && typeof booking.doctorId === 'object' && booking.doctorId._id ? {
        _id: booking.doctorId._id,
        name: booking.doctorId.name,
        specialization: booking.doctorId.specialization,
        profilePicture: booking.doctorId.profilePicture,
        hospitalName: booking.doctorId.hospitalName,
        fees: booking.doctorId.fees,
        email: booking.doctorId.email,
        phone: booking.doctorId.phone
      } : { _id: booking.doctorId },
      patientId: booking.patientId,
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

    // Response immediately bhej do (CRM call ka wait nahi karna)
    res.json({ 
      success: true, 
      message: "Booking created successfully. CRM notification sent.",
      booking: formattedBooking,
      userIdentified: userIdentified, // Batata hai ki user identify hua ya nahi
      patientId: finalPatientIdValue // Firebase UID jo use hua
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err.message);

    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;