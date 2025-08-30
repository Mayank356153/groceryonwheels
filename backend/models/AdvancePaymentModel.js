const mongoose = require('mongoose');

const advancePaymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerData", required: true },
  amount: { type: Number, required: true },
  paymentType: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentType", required: true },
  // Dynamic reference for who created this record:
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
  note: { type: String }
}, { timestamps: true });

const AdvancePayment = mongoose.model('AdvancePayment', advancePaymentSchema);
module.exports = AdvancePayment;
