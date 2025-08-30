const mongoose = require("mongoose");

const moneyTransferSchema = new mongoose.Schema({
  transferDate: { type: Date, required: true },
  transferCode: { type: String, required: true, unique: true },
  debitAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  creditAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  amount: { type: Number, required: true },
  referenceNo: { type: String },
  note: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "createdByModel",
    required: false, 
  },
  createdByModel: {
    type: String,
    enum: ["User", "Admin"],
    required: false,
  }, // optional
}, { timestamps: true });

module.exports = mongoose.model("MoneyTransfer", moneyTransferSchema);
