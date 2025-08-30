const mongoose = require("mongoose");


const QuotationItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const QuotationSchema = new mongoose.Schema(
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
    quotationCode: { type: String, required: true }, // e.g., "QT/2025/01"
    quotationDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    referenceNo: { type: String, default: "" },

    
    items: [QuotationItemSchema],

    otherCharges: { type: Number, default: 0 },
    note: { type: String, default: "" },

    
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },

    
    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", QuotationSchema);