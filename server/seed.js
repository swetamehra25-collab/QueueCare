import "dotenv/config";
import { connectDatabase } from "./config/db.js";
import Appointment from "./models/Appointment.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
import QueueCounter from "./models/QueueCounter.js";
import User from "./models/User.js";
import mongoose from "mongoose";

const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("Set ADMIN_EMAIL to the administrator's valid email address before seeding.");
}
if (!adminPassword || !adminPassword.trim() || adminPassword.length < 12) {
  throw new Error("Set ADMIN_PASSWORD in .env to a private password of at least 12 characters before seeding.");
}

await connectDatabase();

try {
  let user = await User.findOne({ email: adminEmail });
  if (!user) user = await User.findOne({ email: adminEmail, role: "admin" });
  if (user && user.role !== "admin") throw new Error("ADMIN_EMAIL is already assigned to a non-admin account.");

  if (user) {
    user.name = "Sweta Mehra";
    user.email = adminEmail;
    user.password = adminPassword;
    await user.save();
    console.log("Updated the admin account from the configured environment.");
  } else {
    await User.create({ name: "Sweta Mehra", email: adminEmail, password: adminPassword, role: "admin" });
    console.log("Created the admin account from the configured environment.");
  }

  if (!await Doctor.exists({})) {
    await Doctor.insertMany([
      { name: "Maya Chen", specialty: "Cardiology", department: "Heart & vascular", email: "maya.chen@northside.example", phone: "+1 (555) 014-2201", room: "204", status: "Available" },
      { name: "James Rivera", specialty: "Family medicine", department: "Primary care", email: "james.rivera@northside.example", phone: "+1 (555) 014-2202", room: "108", status: "In consultation" },
      { name: "Aisha Patel", specialty: "Pediatrics", department: "Children’s health", email: "aisha.patel@northside.example", phone: "+1 (555) 014-2203", room: "312", status: "Available" },
    ]);
  }
  if (!await Patient.exists({})) {
    const patients = await Patient.insertMany([
      { patientId: `QC-${new Date().getFullYear()}-A19F2C`, fullName: "Olivia Bennett", email: "olivia.bennett@example.com", phone: "+1 (555) 010-4812", age: 34, gender: "Female", bloodGroup: "O+", condition: "Annual wellness visit" },
      { patientId: `QC-${new Date().getFullYear()}-C72B14`, fullName: "Ethan Brooks", email: "ethan.brooks@example.com", phone: "+1 (555) 010-3956", age: 52, gender: "Male", bloodGroup: "A+", condition: "Blood pressure follow-up" },
      { patientId: `QC-${new Date().getFullYear()}-D08A3E`, fullName: "Sofia Martinez", email: "sofia.martinez@example.com", phone: "+1 (555) 010-7044", age: 8, gender: "Female", bloodGroup: "A-", condition: "Seasonal allergies" },
      { patientId: `QC-${new Date().getFullYear()}-F50C9A`, fullName: "Noah Williams", email: "noah.williams@example.com", phone: "+1 (555) 010-8220", age: 29, gender: "Male", bloodGroup: "B+", condition: "Cardiology follow-up" },
    ]);
    const doctors = await Doctor.find().sort({ createdAt: 1 });
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const today = new Date(`${todayKey}T00:00:00.000Z`);
    await Appointment.insertMany(patients.slice(0, 3).map((patient, index) => ({
      patient: patient._id, doctor: doctors[index % doctors.length]._id, date: today,
      time: ["09:30", "10:00", "10:30"][index], type: ["Annual check-up", "Follow-up", "Pediatrics consultation"][index],
      status: index === 0 ? "waiting" : "scheduled", tokenNumber: index === 0 ? 1 : null,
    })));
    await QueueCounter.updateOne({ _id: todayKey }, { $max: { value: 1 } }, { upsert: true });
  }
  console.log("QueueCare demo data is ready.");
} finally {
  await mongoose.disconnect();
}
