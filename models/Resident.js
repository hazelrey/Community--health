import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"], trim: true },
    age: { type: Number, required: [true, "Age is required"], min: 0, max: 120 },
    sex: { type: String, enum: ["Male", "Female"], required: [true, "Sex is required"] },
    purok: { type: String, required: [true, "Purok is required"], trim: true },
    contact: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Resident", residentSchema);