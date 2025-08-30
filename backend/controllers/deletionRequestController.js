const mongoose = require("mongoose");
const Warehouse        = require("../models/warehouseModel");
const DeletionRequest  = require("../models/deletionRequestModel");
const User            = require("../models/userModel"); 

exports.createRequest = async (req, res) => {
  const { itemType, itemId, reason } = req.body;
  if (!itemType || !itemId)
    return res.status(400).json({ message:"itemType & itemId required" });

  const exists = await DeletionRequest.findOne({
    itemType, itemId, status:"PENDING"
  });
  if (exists) return res.status(409).json({ message:"Request already pending." });

  const doc = await DeletionRequest.create({
    itemType, itemId, reason,
    requestedBy: req.user.id
  });
  res.status(201).json({ success:true, data:doc });
};

exports.listRequests = async (req, res) => {
  const status = req.query.status || "PENDING";
  const list = await DeletionRequest.find({ status }).populate({
      path:   "requestedBy",       // the foreign‐key to User
      model:  User,
      select: "FirstName LastName userName Email"
    })
  .populate({                                     // add this:
      path:   "itemId",
      model:  "Warehouse",
      select: "warehouseName"
    });
  res.json({ success:true, data:list });
};

exports.approveRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const dr = await DeletionRequest.findById(req.params.id).session(session);
      if (!dr) return res.status(404).json({ message:"Request not found" });
      if (dr.status !== "PENDING")
        return res.status(400).json({ message:"Already processed" });

      // only Warehouse for now – expand later if needed
      if (dr.itemType === "Warehouse") {
        await Warehouse.deleteOne({ _id: dr.itemId }).session(session);
      } else {
        throw new Error("Unknown itemType");
      }

      dr.status     = "APPROVED";
      dr.approvedBy = req.user.id;
      dr.approvedAt = new Date();
      await dr.save({ session });
    });
    res.json({ success:true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:err.message });
  } finally {
    session.endSession();
  }
};

exports.rejectRequest = async (req, res) => {
  const dr = await DeletionRequest.findById(req.params.id);
  if (!dr) return res.status(404).json({ message:"Request not found" });
  if (dr.status !== "PENDING")
    return res.status(400).json({ message:"Already processed" });

  dr.status     = "REJECTED";
  dr.approvedBy = req.user.id;
  dr.approvedAt = new Date();
  await dr.save();

  res.json({ success:true });
};
