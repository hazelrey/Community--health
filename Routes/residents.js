import { Router } from "express";
import Resident from "../models/Resident.js";
import Transaction from "../models/Transaction.js";

const router = Router();

const fail = (res, err) => {
  const status = err.name === "ValidationError" || err.name === "CastError" ? 400 : 500;
  res.status(status).json({ message: err.message });
};

router.get("/", async (req, res) => {
  try {
    res.json(await Resident.find().sort({ createdAt: -1 }));
  } catch (err) { fail(res, err); }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await Resident.create(req.body));
  } catch (err) { fail(res, err); }
});

router.put("/:id", async (req, res) => {
  try {
    const doc = await Resident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
   if (!doc) return res.status(404).json({ message: "Resident not found" });
    res.json(doc);
  } catch (err) { fail(res, err); }
});

router.delete("/:id", async (req, res) => {
  try {
    const doc = await Resident.findByIdAndDelete(req.params.id);
   if (!doc) return res.status(404).json({ message: "Resident not found" });
    await Transaction.deleteMany({ resident: req.params.id });
    res.json({ message: "Resident deleted" });
  } catch (err) { fail(res, err); }
});

export default router;