const mongoose = require("mongoose");

const customerMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer",     required: true },
  body:         { type: String, required: true },
  readBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: "Customer" }]   // for read receipts
}, { timestamps: true });

module.exports = mongoose.model("CustomerMessage", customerMessageSchema);
