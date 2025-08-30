// routes/ledger.js
const express       = require("express");
const router        = express.Router();
const mongoose      = require("mongoose");
const { postVanCash, putVanCash } = require("../controllers/vanCashController");
const Ledger = require("../models/ledgerModel");
router.post('/van-cash', postVanCash);
router.put('/van-cash', putVanCash);
router.get("/transactions", async (req, res) => {
  try {
    const { warehouseId, date, start, end } = req.query;
    if (!warehouseId) return res.status(400).json({ message: "warehouseId required" });

    let filter = { warehouse: mongoose.Types.ObjectId(warehouseId) };
    if (start && end) {
      filter.date = {
        $gte: new Date(start),
        $lte: new Date(end + "T23:59:59.999Z"),
      };
    } else if (date) {
      const d = new Date(date);
      filter.date = {
        $gte: d,
        $lte: new Date(d.getTime() + 86400000 - 1),
      };
    }

    const entries = await Ledger.find(filter).sort({ date: 1 }).lean();
    res.json({ data: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
