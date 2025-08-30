const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account", 
    default: null
  },
  accountNumber: { type: String, required: true, unique: true },
  accountName: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  note: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: "createdByModel"
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ["User", "Admin"]
  },
  status: { type: String, default: "Active" },
}, { timestamps: true });

module.exports = mongoose.model("Account", accountSchema);
