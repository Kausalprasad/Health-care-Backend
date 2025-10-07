const mongoose = require("mongoose");
const Doctor = require("../models/doctor");

const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "Tuesday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "Thursday", startTime: "15:00", endTime: "18:00", isAvailable: true },
      { day: "Friday", startTime: "10:00", endTime: "13:00", isAvailable: true },
      { day: "Saturday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Saturday", startTime: "10:00", endTime: "13:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Saturday", startTime: "10:00", endTime: "13:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Thursday", startTime: "14:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:00", endTime: "12:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "14:00", endTime: "17:00", isAvailable: true }
    ],
    calendar: []
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
    verified: true,
    schedule: [
      { day: "Tuesday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Thursday", startTime: "14:00", endTime: "17:00", isAvailable: true }
    ],
    calendar: []
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
