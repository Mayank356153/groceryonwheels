const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: [
      "OPENING_BALANCE",
      "CASH_SALE",
      "BANK_SALE",
      "DEPOSIT",
      "MONEY_TRANSFER",
      "VAN_CASH",
      "CLOSING_BALANCE",
      "EXPENSE",
    ],
    required: true,
  },
  amount: { type: Number, required: true },
  warehouse: { type: mongoose.Types.ObjectId, ref: "Warehouse", required: true },
  referenceId: { type: mongoose.Types.ObjectId, required: false },
  refModel: { type: String, enum: ["Sale", "Sales", "PosOrder", "Purchase", "Expense"], required: false },
  remark: { type: String, required: false } // Added remark field, optional
});

ledgerSchema.index(
  { warehouse: 1, type: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "VAN_CASH" },
  }
);

module.exports = mongoose.model("Ledger", ledgerSchema);