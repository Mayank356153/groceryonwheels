const mongoose = require("mongoose");

const OpeningBalancePaymentSchema = new mongoose.Schema(
  {
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentType",
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentNote: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const customerDataSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  panNumber: {
    type: String,
  },
  taxNumber: {
    type: String,
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  previousDue: {
    type: Number,
    default: 0,
  },
  attachmentPath: {
    type: String,
    default: "",
  },
  customerImage: {
    type: String,
    default: "",
  },
  salesReturnDue: {
    type: Number,
    default: 0,
  },
  address: {
    country: { type: String },
    city: { type: String },
    area: { type: String },
    state: { type: String },
    postcode: { type: String },
    locationLink: { type: String },
  },
  shippingAddress: {
    country: { type: String },
    city: { type: String },
    area: { type: String },
    state: { type: String },
    postcode: { type: String },
    locationLink: { type: String },
  },
  // ADVANCED SECTION
  priceLevelType: {
    type: String,
    default: "Increase", // or "Decrease", etc.
  },
  priceLevel: {
    type: Number,
    default: 0,
  },
  openingBalancePayments: {
    type: [OpeningBalancePaymentSchema],
    default: [],
  },
  // New field to track current advance payment balance
  advanceBalance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CustomerData = mongoose.model("CustomerData", customerDataSchema);
module.exports = CustomerData;
