const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    transferDate: {
      type: Date,
      required: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        mrp: { type: Number },
        expiryDate: { type: Date },
        quantity: { type: Number, required: true },
      },
    ],
    note: { type: String },
    createdBy: {
      type: String,
      default: "system",
    },
    details: { type: String }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransfer", stockTransferSchema);
