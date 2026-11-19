import mongoose from "mongoose";

export const SERVICES = [
  "Medical Consultation",
  "Immunization",
  "Prenatal Check-up",
  "Blood Pressure Check",
  "Dental Service",
  "Medicine Distribution",
];

const transactionSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: [true, "resident is required"] },
    service: { type: String, enum: SERVICES, required: [true, "Service is required"] },
    amount: { type: Number, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ["Paid", "Unpaid", "Free"], default: "Free" },
    serviceDate: { type: Date, required: [true, "Service date is required"] },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);