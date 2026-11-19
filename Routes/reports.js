import { Router } from "express";
import Resident from "../models/Resident.js";
import Transaction from "../models/Transaction.js";

const router = Router();

router.get("/summary", async (req,res) => {
  try {
    const [residents, transactions, money, byService] = await Promise.all([
     Resident.countDocuments(),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $group: { _id: "$paymentStatus", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $group: { _id: "$service", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const pick = (status) => money.find((m) => m._id === status) || { total: 0, count: 0 };

   res.json({
     residents,
      transactions,
      collected: pick("Paid").total,
      unpaidAmount: pick("Unpaid").total,
      unpaidCount: pick("Unpaid").count,
      byService: byService.map((s) => ({ service: s._id, count: s.count })),
    });
  } catch (err) {
   res.status(500).json({ message: err.message });
  }
});

export default router;
