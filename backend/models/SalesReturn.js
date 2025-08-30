const mongoose = require("mongoose");

const ReturnItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, default: "" },
});

const PaymentSchema = new mongoose.Schema({
  paymentType: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentType", required: false },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: false },
  amount: { type: Number, default: 0 },
  paymentNote: { type: String, default: "" },
  paymentDate: { type: Date, default: Date.now }
}, { _id: false });

const SalesReturnSchema = new mongoose.Schema(
  {
    // Reference the original sale (optional)
    sale: { type: mongoose.Schema.Types.ObjectId, refPath: "saleModel" }, // Not required
    saleModel: { type: String, enum: ["Sales", "PosOrder", null], default: null }, // Not required
    returnCode: { type: String, required: true },
    referenceNo: { type: String, default: "" },
    returnDate: { type: Date, default: Date.now },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerData",
      required: true,
    },
    items: [ReturnItemSchema],
    totalRefund: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Return", "Cancel"],
      default: "Return",
    },
    otherCharges: { type: Number, default: 0 },
    discountCouponCode: { type: String, default: "" },
    couponType: { type: String, default: "" },
    couponValue: { type: Number, default: 0 },
    discountOnAll: { type: Number, default: 0 },
    note: { type: String, default: "" },
    payments: [PaymentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesReturn", SalesReturnSchema);