const mongoose = require("mongoose");

const cashTransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  paymentCode: { type: String },
  
  paymentType: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentType",
    required: true,
  },
  paymentNote: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
}, { timestamps: true });

module.exports = mongoose.model("CashTransaction", cashTransactionSchema);
