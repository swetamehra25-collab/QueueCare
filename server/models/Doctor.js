import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  specialty: { type: String, required: true, trim: true, maxlength: 100 },
  department: { type: String, trim: true, maxlength: 100, default: "" },
  email: { type: String, lowercase: true, trim: true, default: "" },
  phone: { type: String, trim: true, maxlength: 30, default: "" },
  room: { type: String, trim: true, maxlength: 30, default: "" },
  status: { type: String, enum: ["Available", "In consultation", "On leave"], default: "Available" },
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);
