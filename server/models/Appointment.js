import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  type: { type: String, required: true, trim: true, maxlength: 100 },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: ["scheduled", "waiting", "in-consultation", "completed", "cancelled"], default: "scheduled", index: true },
  tokenNumber: { type: Number, min: 1, default: null },
  checkedInAt: { type: Date, default: null },
}, { timestamps: true });

appointmentSchema.index({ date: 1, tokenNumber: 1 }, { unique: true, partialFilterExpression: { tokenNumber: { $type: "number" } } });
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["scheduled", "waiting", "in-consultation"] } },
  },
);

export default mongoose.model("Appointment", appointmentSchema);
