import mongoose from "mongoose";

const queueCounterSchema = new mongoose.Schema({
  _id: { type: String },
  value: { type: Number, default: 0 },
});

export default mongoose.model("QueueCounter", queueCounterSchema);
