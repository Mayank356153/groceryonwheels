const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    adjustmentDate: {
      type: Date,
      required: true,
    },
    referenceNo: {
      type: String,
      unique: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalQuantity: {
      type: Number,
      default: 0,
    },
    note: { type: String },
    createdBy: {
      type: String, 
      default: "system",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);
