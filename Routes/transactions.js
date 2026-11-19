import { Router } from "express";
import Transaction, { SERVICES } from "../models/Transaction.js";

const router = Router();

const fail = (res, err) => {
  const status = err.name === "ValidationError" || err.name === "CastError" ? 400 : 500;
  res.status(status).json({ message: err.message });
};

router.get("/services", (req, res) => res.json(SERVICES));

router.get("/", async (req, res) => {
  try{
    const list = await Transaction.find()
      .populate("resident", "fullName purok")
      .sort({ serviceDate: -1, createdAt: -1 });
    res.json(list);
  } catch (err) { fail(res, err); }
});

router.post("/", async (req, res) => {
  try{
    const doc = await Transaction.create(req.body);
    res.status(201).json(await doc.populate("resident", "fullName purok"));
  } catch (err) { fail(res, err); }
});

router.put("/:id", async (req, res) => {
  try{
    const doc = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("resident", "fullName purok");
   if (!doc) return res.status(404).json({ message: "Transaction not found" });
    res.json(doc);
  } catch (err) { fail(res, err); }
});

router.delete("/:id", async (req, res) => {
  try{
    const doc = await Transaction.findByIdAndDelete(req.params.id);
   if (!doc) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) { fail(res, err); }
});

export default router;