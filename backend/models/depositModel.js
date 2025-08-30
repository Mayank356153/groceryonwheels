const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  depositDate: { type: Date, required: true },
  referenceNo: { type: String },
  debitAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  creditAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  amount: { type: Number, required: true },
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

module.exports = mongoose.model("Deposit", depositSchema);
