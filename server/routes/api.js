import { Router } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Patient from "../models/Patient.js";
import QueueCounter from "../models/QueueCounter.js";
import User from "../models/User.js";
import { sendAppointmentConfirmation, sendPatientWelcome, sendTestEmail } from "../services/email.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const pick = (source, fields) => Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
const patientFields = ["fullName", "email", "phone", "age", "gender", "bloodGroup", "condition"];
const doctorFields = ["name", "specialty", "department", "email", "phone", "room", "status"];
const appointmentFields = ["patient", "doctor", "date", "time", "type", "notes"];
const emergencyFields = ["patientName", "location", "condition", "severity"];
const populateAppointment = (query) => query.populate("patient", "fullName patientId phone").populate("doctor", "name specialty department");
const patientUser = (user, patientRecord = null) => ({
  id: user.id,
  name: user.role === "admin" ? "Sweta Mehra" : user.name,
  email: user.email,
  role: user.role,
  ...(patientRecord?.patientId ? { patientId: patientRecord.patientId }
    : user.patient?.patientId ? { patientId: user.patient.patientId }
      : user.patient ? { patientId: "—" } : {}),
});

function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function utcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function utcDayRange(date) {
  const start = new Date(`${utcDateKey(date)}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function dailySlots(date, now = new Date()) {
  if (date.getUTCDay() === 0 || date.getUTCDay() === 6) return [];
  const slots = [];
  const dateKey = date.toISOString().slice(0, 10);
  const isToday = dateKey === localDateKey(now);
  const localTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  for (let minutes = 9 * 60; minutes < 17 * 60; minutes += 30) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    if (isToday && time <= localTime) continue;
    slots.push(time);
  }
  return slots;
}

async function allocateDailyToken(date) {
  const dayKey = utcDateKey(date);
  const { start, end } = utcDayRange(date);
  const lastAppointment = await Appointment.findOne({ date: { $gte: start, $lt: end }, tokenNumber: { $ne: null } }).sort({ tokenNumber: -1 }).select("tokenNumber");
  await QueueCounter.findOneAndUpdate(
    { _id: dayKey },
    { $max: { value: lastAppointment?.tokenNumber || 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const counter = await QueueCounter.findOneAndUpdate(
    { _id: dayKey },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return counter.value;
}

router.post("/auth/login", asyncRoute(async (req, res) => {
  const email = String((req.body || {}).email || "").toLowerCase().trim();
  const password = String((req.body || {}).password || "");
  const user = await User.findOne({ email, role: { $in: ["admin", "staff"] } }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "The email or password you entered isn’t right." });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "12h" });
  return res.json({ token, user: patientUser(user) });
}));

router.post("/auth/patient/login", asyncRoute(async (req, res) => {
  const email = String((req.body || {}).email || "").toLowerCase().trim();
  const password = String((req.body || {}).password || "");
  const user = await User.findOne({ email, role: "patient" }).select("+password").populate("patient", "patientId");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "The email or password you entered isn’t right." });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "12h" });
  return res.json({ token, user: patientUser(user) });
}));

router.post("/auth/patient/register", asyncRoute(async (req, res) => {
  const body = req.body || {};
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const phone = String(body.phone || "").trim();
  const age = Number(body.age);
  const gender = String(body.gender || "");
  const acceptedGenders = ["Female", "Male", "Non-binary", "Prefer not to say"];
  if (!fullName || fullName.length > 100 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128 || !phone || phone.length > 30 || body.age === undefined || String(body.age).trim() === "" || !Number.isInteger(age) || age < 0 || age > 130 || !acceptedGenders.includes(gender)) {
    return res.status(400).json({ message: "Enter a valid name, email, password (at least 8 characters), phone, age, and gender." });
  }
  if (await User.exists({ email })) return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
  const patient = await Patient.create({
    patientId: `QC-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    fullName,
    email,
    phone,
    age,
    gender,
    bloodGroup: "",
  });
  let user;
  try {
    user = await User.create({ name: fullName, email, password, role: "patient", patient: patient._id });
  } catch (error) {
    await patient.deleteOne();
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
    throw error;
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "12h" });
  let emailSent = false;
  try {
    await sendPatientWelcome({ to: patient.email, patientName: patient.fullName });
    emailSent = true;
  } catch (error) {
    console.error(`Patient account ${user.id} was created, but its welcome email could not be sent:`, error);
  }
  return res.status(201).json({ token, user: patientUser(user, patient), emailSent });
}));

router.use(requireAuth);
router.post("/auth/password/change", requireRole("admin", "staff"), asyncRoute(async (req, res) => {
  const currentPassword = String((req.body || {}).currentPassword || "");
  const newPassword = String((req.body || {}).newPassword || "");
  if (newPassword.length < 12 || newPassword.length > 128) return res.status(400).json({ message: "Use a new password between 12 and 128 characters." });
  const user = await User.findById(req.user.id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) return res.status(401).json({ message: "Your current password is not correct." });
  user.password = newPassword;
  await user.save();
  return res.json({ message: "Password changed successfully." });
}));

router.get("/auth/me", (req, res) => res.json({ user: patientUser(req.user) }));

router.get("/portal/doctors", requireRole("patient"), asyncRoute(async (req, res) => {
  const data = await Doctor.find().select("name specialty department room status").sort({ name: 1 });
  res.json({ data });
}));

router.get("/portal/slots", requireRole("patient"), asyncRoute(async (req, res) => {
  const date = parseDateOnly(req.query.date);
  if (!date) return res.status(400).json({ message: "Choose a valid appointment date." });
  if (date.toISOString().slice(0, 10) < localDateKey(new Date())) return res.status(400).json({ message: "Appointment dates must be today or later." });
  const doctorId = String(req.query.doctorId || "");
  if (!/^[a-f\d]{24}$/i.test(doctorId) || !await Doctor.exists({ _id: doctorId, status: { $ne: "On leave" } })) {
    return res.status(404).json({ message: "Choose an available clinician." });
  }
  const { start, end } = utcDayRange(date);
  const booked = await Appointment.find({
    doctor: doctorId,
    date: { $gte: start, $lt: end },
    status: { $in: ["scheduled", "waiting", "in-consultation"] },
  }).select("time");
  const taken = new Set(booked.map((appointment) => appointment.time));
  return res.json({ data: dailySlots(date).filter((time) => !taken.has(time)) });
}));

router.get("/portal/appointments", requireRole("patient"), asyncRoute(async (req, res) => {
  if (!req.user.patient) return res.status(409).json({ message: "This account isn’t linked to a patient profile. Contact the care team." });
  const data = await Appointment.find({ patient: req.user.patient })
    .populate("doctor", "name specialty department room")
    .sort({ date: -1, time: -1 })
    .limit(200);
  const waitingDays = [...new Set(data.filter((appointment) => appointment.status === "waiting").map((appointment) => utcDateKey(appointment.date)))];
  const waitingRecords = waitingDays.length ? await Appointment.find({
    $or: waitingDays.map((day) => {
      const { start, end } = utcDayRange(parseDateOnly(day));
      return { date: { $gte: start, $lt: end } };
    }),
    status: "waiting",
  }).select("_id date tokenNumber").sort({ date: 1, tokenNumber: 1 }) : [];
  const waitingByDate = new Map();
  for (const item of waitingRecords) {
    const day = utcDateKey(item.date);
    if (!waitingByDate.has(day)) waitingByDate.set(day, []);
    waitingByDate.get(day).push(item);
  }
  const appointments = data.map((appointment) => {
    const day = utcDateKey(appointment.date);
    const waiting = waitingByDate.get(day);
    const ownIndex = waiting?.findIndex((item) => item._id.equals(appointment._id)) ?? -1;
    return {
      ...appointment.toObject(),
      queuePosition: ownIndex >= 0 ? ownIndex + 1 : null,
    };
  });
  return res.json({ data: appointments });
}));

router.post("/portal/appointments", requireRole("patient"), asyncRoute(async (req, res) => {
  if (!req.user.patient) return res.status(409).json({ message: "This account isn’t linked to a patient profile. Contact the care team." });
  const body = req.body || {};
  const date = parseDateOnly(body.date);
  const doctorId = String(body.doctor || "");
  const time = String(body.time || "");
  const type = String(body.type || "General consultation").trim();
  if (!date || !/^[a-f\d]{24}$/i.test(doctorId) || !dailySlots(date).includes(time) || type.length > 100) {
    return res.status(400).json({ message: "Choose a valid future weekday and available appointment time." });
  }
  if (date.toISOString().slice(0, 10) < localDateKey(new Date())) return res.status(400).json({ message: "Appointment dates must be today or later." });
  const doctor = await Doctor.findOne({ _id: doctorId, status: { $ne: "On leave" } }).select("name specialty");
  if (!doctor) return res.status(404).json({ message: "This clinician is no longer available for booking." });
  const { start, end } = utcDayRange(date);
  const existing = await Appointment.exists({
    doctor: doctor._id,
    date: { $gte: start, $lt: end },
    time,
    status: { $in: ["scheduled", "waiting", "in-consultation"] },
  });
  if (existing) return res.status(409).json({ message: "That time was just booked. Please choose another available slot." });
  const tokenNumber = await allocateDailyToken(date);
  let appointment;
  try {
    appointment = await Appointment.create({
      patient: req.user.patient,
      doctor: doctor._id,
      date,
      time,
      type,
      tokenNumber,
    });
  } catch (error) {
    const duplicateSlot = error.code === 11000
      && error.keyPattern?.doctor
      && error.keyPattern?.date
      && error.keyPattern?.time;
    if (duplicateSlot) return res.status(409).json({ message: "That slot was just booked. Please choose another available slot." });
    throw error;
  }
  const data = await Appointment.findById(appointment._id).populate("doctor", "name specialty department room");
  const patient = await Patient.findById(req.user.patient).select("fullName email");
  let emailSent = false;
  try {
    if (!patient?.email) throw new Error("The patient profile does not have an email address.");
    await sendAppointmentConfirmation({
      to: patient.email,
      patientName: patient.fullName,
      doctorName: doctor.name,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      tokenNumber: appointment.tokenNumber,
    });
    emailSent = true;
  } catch (error) {
    console.error(`Appointment ${appointment.id} was booked, but its confirmation email could not be sent:`, error);
  }
  return res.status(201).json({ data, emailSent });
}));

router.post("/portal/appointments/:id/cancel", requireRole("patient"), asyncRoute(async (req, res) => {
  if (!req.user.patient) return res.status(409).json({ message: "This account isn’t linked to a patient profile. Contact the care team." });
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user.patient });
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  const appointmentDay = appointment.date.toISOString().slice(0, 10);
  const today = localDateKey(new Date());
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (appointment.status !== "scheduled" || appointmentDay < today || (appointmentDay === today && appointment.time <= currentTime)) {
    return res.status(409).json({ message: "Only future scheduled appointments can be cancelled online. Contact the care team for help." });
  }
  appointment.status = "cancelled";
  await appointment.save();
  return res.json({ message: "Appointment cancelled." });
}));

router.use(requireRole("admin", "staff"));
router.get("/dashboard", asyncRoute(async (req, res) => {
  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
  const weekStart = new Date(startToday); weekStart.setDate(weekStart.getDate() - 6);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [totalPatients, totalAppointments, patientsToday, appointmentsToday, weekly, waiting, queue, waitingTimes, upcoming, emergencies] = await Promise.all([
    Patient.countDocuments(),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: { $gte: startToday, $lt: endToday }, status: { $in: ["waiting", "in-consultation", "completed"] } }),
    Appointment.countDocuments({ date: { $gte: startToday, $lt: endToday }, status: { $ne: "cancelled" } }),
    Appointment.aggregate([
      { $match: { $or: [{ status: "completed" }, { checkedInAt: { $ne: null } }] } },
      { $addFields: { visitDate: { $ifNull: ["$checkedInAt", "$date"] } } },
      { $match: { visitDate: { $gte: weekStart, $lt: endToday } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitDate", timezone: timeZone } }, count: { $sum: 1 } } },
    ]),
    Appointment.countDocuments({ status: "waiting" }),
    populateAppointment(Appointment.find({ status: "waiting" }).sort({ checkedInAt: 1, createdAt: 1 }).limit(8)),
    Appointment.find({ status: "waiting" }).select("checkedInAt createdAt").lean(),
    populateAppointment(Appointment.find({ date: { $gte: startToday, $lt: endToday }, status: "scheduled" }).sort({ time: 1 }).limit(4)),
    EmergencyRequest.countDocuments({ status: { $ne: "resolved" } }),
  ]);
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart); date.setDate(weekStart.getDate() + index);
    const key = localDateKey(date);
    return { label: date.toLocaleDateString("en", { weekday: "short" }), count: weekly.find((item) => item._id === key)?.count || 0 };
  });
  const averageWait = waitingTimes.length
    ? Math.round(waitingTimes.reduce((total, item) => total + Math.max(0, now - (item.checkedInAt || item.createdAt)) / 60000, 0) / waitingTimes.length)
    : 0;
  return res.json({
    stats: { totalPatients, totalAppointments, patientsToday, appointmentsToday, waiting, avgWait: averageWait },
    weeklyActivity, queue, upcoming, activeEmergencies: emergencies,
  });
}));

router.get("/patients", asyncRoute(async (req, res) => {
  const term = String(req.query.search || "").trim().slice(0, 100);
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = escapedTerm ? { $or: ["fullName", "patientId", "phone", "email"].map((field) => ({ [field]: { $regex: escapedTerm, $options: "i" } })) } : {};
  const [data, totalCount] = await Promise.all([
    Patient.find(filter).sort({ updatedAt: -1 }).limit(500),
    Patient.countDocuments(filter),
  ]);
  res.json({ data, totalCount });
}));

router.post("/patients", asyncRoute(async (req, res) => {
  const patientId = `QC-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const patient = await Patient.create({ ...pick(req.body || {}, patientFields), patientId });
  res.status(201).json({ data: patient });
}));

router.put("/patients/:id", asyncRoute(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, pick(req.body || {}, patientFields), { new: true, runValidators: true });
  if (!patient) return res.status(404).json({ message: "Patient not found." });
  return res.json({ data: patient });
}));

router.delete("/patients/:id", asyncRoute(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found." });
  if (await User.exists({ patient: patient._id })) {
    return res.status(409).json({ message: "This patient has a portal account and can’t be deleted. Update the record instead." });
  }
  const hasAppointments = await Appointment.exists({ patient: patient._id });
  if (hasAppointments) return res.status(409).json({ message: "This patient has appointment history and can’t be deleted. Update the record instead." });
  await patient.deleteOne();
  return res.json({ message: "Patient deleted." });
}));

router.get("/doctors", asyncRoute(async (req, res) => {
  const data = await Doctor.find().sort({ name: 1 });
  res.json({ data });
}));

router.post("/doctors", asyncRoute(async (req, res) => {
  const doctor = await Doctor.create(pick(req.body || {}, doctorFields));
  res.status(201).json({ data: doctor });
}));

router.put("/doctors/:id", asyncRoute(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, pick(req.body || {}, doctorFields), { new: true, runValidators: true });
  if (!doctor) return res.status(404).json({ message: "Clinician not found." });
  return res.json({ data: doctor });
}));

router.delete("/doctors/:id", asyncRoute(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: "Clinician not found." });
  const hasAppointments = await Appointment.exists({ doctor: doctor._id, status: { $in: ["scheduled", "waiting", "in-consultation"] } });
  if (hasAppointments) return res.status(409).json({ message: "This clinician has active appointments. Reassign or complete them before removing the clinician." });
  await doctor.deleteOne();
  return res.json({ message: "Clinician removed." });
}));

router.get("/appointments", asyncRoute(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  const [data, totalCount] = await Promise.all([
    populateAppointment(Appointment.find(filter).sort({ date: -1, time: 1 }).limit(500)),
    Appointment.countDocuments(filter),
  ]);
  res.json({ data, totalCount });
}));

router.post("/appointments", asyncRoute(async (req, res) => {
  const data = pick(req.body || {}, appointmentFields);
  const date = parseDateOnly(String(data.date || ""));
  const time = String(data.time || "");
  const type = String(data.type || "").trim();
  if (!date || !dailySlots(date).includes(time) || type.length < 1 || type.length > 100) {
    return res.status(400).json({ message: "Choose a future weekday, valid time, patient, clinician, and visit type." });
  }
  if (!await Patient.exists({ _id: data.patient })) return res.status(400).json({ message: "Choose an existing patient." });
  const doctor = await Doctor.findOne({ _id: data.doctor, status: { $ne: "On leave" } });
  if (!doctor) return res.status(400).json({ message: "Choose an available clinician." });
  const { start, end } = utcDayRange(date);
  if (await Appointment.exists({ doctor: doctor._id, date: { $gte: start, $lt: end }, time, status: { $in: ["scheduled", "waiting", "in-consultation"] } })) {
    return res.status(409).json({ message: "That clinician is already booked at this time." });
  }
  const tokenNumber = await allocateDailyToken(date);
  const appointment = await Appointment.create({ ...data, date, time, type, tokenNumber });
  const populated = await populateAppointment(Appointment.findById(appointment._id));
  const patient = await Patient.findById(data.patient).select("fullName email");
  if (patient?.email) {
    try {
      await sendAppointmentConfirmation({ to: patient.email, patientName: patient.fullName, doctorName: doctor.name, date: appointment.date, time: appointment.time, type: appointment.type, tokenNumber: appointment.tokenNumber });
    } catch (error) {
      console.error(`Staff appointment ${appointment.id} was created, but confirmation email could not be sent:`, error);
    }
  }
  res.status(201).json({ data: populated });
}));

router.put("/appointments/:id", asyncRoute(async (req, res) => {
  const existing = await Appointment.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Appointment not found." });
  const update = pick(req.body || {}, appointmentFields);
  if (update.patient && !await Patient.exists({ _id: update.patient })) return res.status(400).json({ message: "Choose an existing patient." });
  if (update.doctor && !await Doctor.exists({ _id: update.doctor })) return res.status(400).json({ message: "Choose an existing clinician." });
  if (update.date && existing.tokenNumber) {
    const nextDate = new Date(update.date);
    const oldDate = new Date(existing.date);
    if (nextDate.toISOString().slice(0, 10) !== oldDate.toISOString().slice(0, 10)) update.tokenNumber = null;
  }
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  return res.json({ data: await populateAppointment(Appointment.findById(appointment._id)) });
}));

router.patch("/appointments/:id/status", asyncRoute(async (req, res) => {
  const { status } = req.body || {};
  const allowed = ["scheduled", "waiting", "in-consultation", "completed", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Choose a valid appointment status." });
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  appointment.status = status;
  if (["waiting", "in-consultation"].includes(status) && !appointment.checkedInAt) appointment.checkedInAt = new Date();
  if (["waiting", "in-consultation"].includes(status) && !appointment.tokenNumber) {
    appointment.tokenNumber = await allocateDailyToken(appointment.date);
  }
  await appointment.save();
  return res.json({ data: await populateAppointment(Appointment.findById(appointment._id)) });
}));

router.delete("/appointments/:id", asyncRoute(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  return res.json({ message: "Appointment deleted." });
}));

router.get("/emergencies", asyncRoute(async (req, res) => {
  const data = await EmergencyRequest.find().populate("requestedBy", "name").sort({ status: 1, severity: 1, createdAt: -1 }).limit(300);
  res.json({ data });
}));

router.post("/emergencies", asyncRoute(async (req, res) => {
  const data = await EmergencyRequest.create({ ...pick(req.body || {}, emergencyFields), requestedBy: req.user._id });
  res.status(201).json({ data: await data.populate("requestedBy", "name") });
}));

router.patch("/emergencies/:id/status", asyncRoute(async (req, res) => {
  const { status } = req.body || {};
  if (!["new", "responding", "resolved"].includes(status)) return res.status(400).json({ message: "Choose a valid emergency status." });
  const data = await EmergencyRequest.findByIdAndUpdate(req.params.id, { status, resolvedAt: status === "resolved" ? new Date() : null }, { new: true, runValidators: true }).populate("requestedBy", "name");
  if (!data) return res.status(404).json({ message: "Emergency request not found." });
  return res.json({ data });
}));

router.delete("/emergencies/:id", asyncRoute(async (req, res) => {
  const data = await EmergencyRequest.findByIdAndDelete(req.params.id);
  if (!data) return res.status(404).json({ message: "Emergency request not found." });
  return res.json({ message: "Emergency request removed." });
}));

router.post("/test-email", requireRole("admin"), asyncRoute(async (req, res) => {
  const email = String((req.body || {}).email || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  try {
    await sendTestEmail({ to: email });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send test email." });
  }
  return res.json({ message: "Test email sent successfully." });
}));

router.post("/email/test", requireRole("admin"), asyncRoute(async (req, res) => {
  const to = String((req.body || {}).to || req.user.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ message: "Enter a valid email address for the delivery test." });
  await sendTestEmail({ to });
  return res.json({ message: `Test email sent successfully to ${to}.` });
}));

export default router;
