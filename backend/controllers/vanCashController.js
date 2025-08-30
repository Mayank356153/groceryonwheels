require("dotenv").config();
const mongoose = require("mongoose");
const Ledger = require("../models/ledgerModel");

exports.postVanCash = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { date, amount, remark = "", warehouse, warehouseId } = req.body;
      const wid = warehouseId || warehouse;               // ✅

      if (!date || amount == null || !wid) {
        return res.status(400).json({ message: "date, amount & warehouse are required" });
      }

      const day      = date.slice(0, 10);
      const startUTC = new Date(`${day}T00:00:00Z`);
      const endUTC   = new Date(`${day}T24:00:00Z`);

      const exists = await Ledger.exists({
        warehouse: wid,                                   // ✅
        type:      "VAN_CASH",
        date:      { $gte: startUTC, $lt: endUTC }
      }).session(session);

      if (exists) {
        return res.status(409).json({ message: "VAN_CASH already set; use PUT instead" });
      }

      const [row] = await Ledger.create([{
        date: new Date(date),
        type: "VAN_CASH",
        amount: +amount,
        warehouse: wid,                                   // ✅
        remark
      }], { session });

      res.status(201).json({ success: true, data: row });
    });
  } catch (err) {
    console.error("postVanCash:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};


exports.putVanCash = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { date, amount, remark = "", warehouse, warehouseId } = req.body;
      const wid = warehouseId || warehouse;               // ✅

      if (!date || amount == null || !wid) {
        return res.status(400).json({ message: "date, amount & warehouse are required" });
      }

      const day      = date.slice(0, 10);
      const startUTC = new Date(`${day}T00:00:00Z`);
      const endUTC   = new Date(`${day}T24:00:00Z`);

      const updated = await Ledger.findOneAndUpdate(
        {
          warehouse: wid,                                 // ✅
          type:      "VAN_CASH",
          date:      { $gte: startUTC, $lt: endUTC }
        },
        { $set: { amount: +amount, date: new Date(date), remark } },
        { new: true, upsert: true, session }
      );

      res.json({ success: true, data: updated });
    });
  } catch (err) {
    console.error("putVanCash:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
