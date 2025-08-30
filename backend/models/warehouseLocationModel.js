// models/warehouseLocationModel.js
const mongoose = require("mongoose");

const warehouseLocationSchema = new mongoose.Schema({
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Warehouse",      // your Warehouse collection
    required: true
  },
  coords: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],        // [lng, lat]
      index: "2dsphere"
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model("WarehouseLocation", warehouseLocationSchema);
