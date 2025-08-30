const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  supplierCode: { type: String, trim: true },
  supplierName: {
    type: String,
    required: true,    // ← only this field is required
    trim: true,
  },
  mobile:    { type: String, trim: true },
  email:     { type: String, trim: true },
  phone:     { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  taxNumber: { type: String, trim: true },
  openingBalance:   { type: Number, default: 0 },
  previousBalance:  { type: Number, default: 0 },
  purchaseDue:      { type: Number, default: 0 },
  purchaseReturnDue:{ type: Number, default: 0 },
  country:  { type: String, trim: true },
  state:    { type: String, trim: true },
  city:     { type: String, trim: true },
  postCode: { type: String, trim: true },
  address:  { type: String, trim: true },
  status:   { type: String, default: "Active" },
}, { timestamps: true });

// (Optional) explicitly create the sparse index if you ever need to:
// supplierSchema.index({ supplierCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Supplier", supplierSchema);

