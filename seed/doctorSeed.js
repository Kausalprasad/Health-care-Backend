const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Doctor = require("../models/doctor");

dotenv.config();

const sampleDoctors = [
  {
    name: "Dr. Rajesh Sharma",
    specialization: "Cardiology",
    experience: 15,
    fees: 800,
    location: "Delhi",
    rating: 4.8,
    bio: "Senior Cardiologist with expertise in heart surgeries",
    phone: "+91-9876543210",
    email: "rajesh.sharma@hospital.com",
    profilePicture: "",
    hospitalName: "Apollo Hospital",
    qualifications: ["MBBS", "MD Cardiology"],
    languages: ["Hindi", "English"],
     availableSlots: ["9 AM", "10 AM", "11 AM", "2 PM", "3 PM", "4 PM"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Priya Singh",
    specialization: "Dermatology",
    experience: 8,
    fees: 600,
    location: "Gurgaon",
    rating: 4.5,
    bio: "Specialist in skin care and cosmetic treatments",
    phone: "+91-9876543211",
    email: "priya.singh@clinic.com",
    profilePicture: "",
    hospitalName: "Skin Care Clinic",
    qualifications: ["MBBS", "MD Dermatology"],
    languages: ["Hindi", "English", "Punjabi"],
    availableSlots: ["10:00-10:30","10:30-11:00","11:00-11:30","11:30-12:00","15:00-15:30","15:30-16:00","16:00-16:30","16:30-17:00"],
    schedule: [
      { day: "monday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "tuesday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "thursday", startTime: "15:00", endTime: "18:00", isAvailable: true },
      { day: "friday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "saturday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Ankit Verma",
    specialization: "Neurology",
    experience: 12,
    fees: 900,
    location: "Noida",
    rating: 4.7,
    bio: "Expert in brain and nervous system disorders",
    phone: "+91-9876543212",
    email: "ankit.verma@neuroclinic.com",
    profilePicture: "",
    hospitalName: "Neuro Clinic",
    qualifications: ["MBBS", "MD Neurology"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","11:00-11:30","14:00-14:30","14:30-15:00","15:00-15:30","15:30-16:00"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Meera Joshi",
    specialization: "Pediatrics",
    experience: 10,
    fees: 700,
    location: "Delhi",
    rating: 4.6,
    bio: "Child specialist with 10+ years experience",
    phone: "+91-9876543213",
    email: "meera.joshi@childcare.com",
    profilePicture: "",
    hospitalName: "Child Care Hospital",
    qualifications: ["MBBS", "MD Pediatrics"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","13:00-13:30","13:30-14:00","14:00-14:30","14:30-15:00"],
    schedule: [
      { day: "tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "saturday", startTime: "10:00", endTime: "13:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Ravi Kapoor",
    specialization: "Orthopedics",
    experience: 14,
    fees: 750,
    location: "Gurgaon",
    rating: 4.4,
    bio: "Specialist in bone and joint problems",
    phone: "+91-9876543214",
    email: "ravi.kapoor@orthoclinic.com",
    profilePicture: "",
    hospitalName: "Ortho Clinic",
    qualifications: ["MBBS", "MS Orthopedics"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","11:00-11:30","15:00-15:30","15:30-16:00","16:00-16:30","16:30-17:00"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Sneha Gupta",
    specialization: "Gynecology",
    experience: 11,
    fees: 800,
    location: "Noida",
    rating: 4.7,
    bio: "Experienced Gynecologist focusing on women's health",
    phone: "+91-9876543215",
    email: "sneha.gupta@womensclinic.com",
    profilePicture: "",
    hospitalName: "Women's Health Clinic",
    qualifications: ["MBBS", "MD Gynecology"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","13:00-13:30","13:30-14:00","14:00-14:30","14:30-15:00"],
    schedule: [
      { day: "tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "saturday", startTime: "10:00", endTime: "13:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Amit Malhotra",
    specialization: "ENT",
    experience: 9,
    fees: 650,
    location: "Delhi",
    rating: 4.3,
    bio: "ENT specialist for ear, nose and throat issues",
    phone: "+91-9876543216",
    email: "amit.malhotra@entclinic.com",
    profilePicture: "",
    hospitalName: "ENT Clinic",
    qualifications: ["MBBS", "MS ENT"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","11:00-11:30","14:00-14:30","14:30-15:00","15:00-15:30","15:30-16:00"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Kavita Mehra",
    specialization: "Psychiatry",
    experience: 13,
    fees: 700,
    location: "Gurgaon",
    rating: 4.6,
    bio: "Psychiatrist focusing on mental health and wellbeing",
    phone: "+91-9876543217",
    email: "kavita.mehra@mentalhealth.com",
    profilePicture: "",
    hospitalName: "Mental Health Clinic",
    qualifications: ["MBBS", "MD Psychiatry"],
    languages: ["Hindi", "English"],
    availableSlots: ["10:00-10:30","10:30-11:00","11:00-11:30","11:30-12:00","15:00-15:30","15:30-16:00","16:00-16:30","16:30-17:00"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "thursday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Rohan Khanna",
    specialization: "Orthopedics",
    experience: 7,
    fees: 550,
    location: "Noida",
    rating: 4.2,
    bio: "Orthopedic surgeon for sports injuries",
    phone: "+91-9876543218",
    email: "rohan.khanna@orthoclinic.com",
    profilePicture: "",
    hospitalName: "Ortho Clinic",
    qualifications: ["MBBS", "MS Orthopedics"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","15:00-15:30","15:30-16:00","16:00-16:30","16:30-17:00"],
    schedule: [
      { day: "monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true }
    ]
  },
  {
    name: "Dr. Anjali Rao",
    specialization: "Cardiology",
    experience: 11,
    fees: 850,
    location: "Delhi",
    rating: 4.7,
    bio: "Cardiologist specializing in preventive heart care",
    phone: "+91-9876543219",
    email: "anjali.rao@heartclinic.com",
    profilePicture: "",
    hospitalName: "Heart Clinic",
    qualifications: ["MBBS", "MD Cardiology"],
    languages: ["Hindi", "English"],
    availableSlots: ["09:00-09:30","09:30-10:00","10:00-10:30","10:30-11:00","14:00-14:30","14:30-15:00","15:00-15:30","15:30-16:00"],
    schedule: [
      { day: "tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "thursday", startTime: "14:00", endTime: "17:00", isAvailable: true }
    ]
  }
];


const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Doctor.deleteMany();
    await Doctor.insertMany(sampleDoctors);
    console.log("✅ Doctors Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDoctors();
