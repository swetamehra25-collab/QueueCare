import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 150 },
  condition: { type: String, required: true, trim: true, maxlength: 500 },
  severity: { type: String, enum: ["critical", "high", "normal"], default: "high", index: true },
  status: { type: String, enum: ["new", "responding", "resolved"], default: "new", index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("EmergencyRequest", emergencyRequestSchema);
