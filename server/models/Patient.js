import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, lowercase: true, trim: true, default: "" },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  age: { type: Number, required: true, min: 0, max: 130 },
  gender: { type: String, enum: ["Female", "Male", "Non-binary", "Prefer not to say"], required: true },
  bloodGroup: { type: String, enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], default: "" },
  condition: { type: String, trim: true, maxlength: 200, default: "" },
}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);
