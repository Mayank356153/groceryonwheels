// models/salesModel.js
const mongoose = require("mongoose");
const { getNextSequence, formatCode } = require("../utils/sequence");

// Subdocument for each item sold
const SalesItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    variant  : { type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tax",
    },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

// Subdocument for each payment entry
const SalesPaymentSchema = new mongoose.Schema(
  {
    paymentCode: { type: String, unique: true },
    amount: { type: Number, required: true },
    terminal    : { type: mongoose.Schema.Types.ObjectId, ref: "Terminal" },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentType",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    paymentNote: { type: String, default: "" },
    paymentDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SalesSchema = new mongoose.Schema(
  {
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["User", "Admin"],
    },
    saleCode: {
      type: String,
      unique: true,
    },
    saleDate: { type: Date, default: Date.now },
    referenceNo: { type: String, default: "" },
    items: [SalesItemSchema],
    otherCharges: { type: Number, default: 0 },
    discountCouponCode: { type: String, default: "" },
    couponType: { type: String, default: "" },
    couponValue: { type: Number, default: 0 },
    discountOnBill: { type: Number, default: 0 },
    note: { type: String, default: "" },
    payments: [SalesPaymentSchema],
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Draft", "Completed", "Cancelled"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

// PRE‐SAVE HOOK: generate saleCode on creation
SalesSchema.pre("save", async function (next) {
  if (this.isNew) {
    const seq = await getNextSequence("saleCode");
    this.saleCode = formatCode("SL", seq);
  }
  next();
});

module.exports = mongoose.model("Sales", SalesSchema);
