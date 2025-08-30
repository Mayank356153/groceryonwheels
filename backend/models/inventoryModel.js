const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  quantity: { 
    type: Number, 
    default: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure there is only one inventory record per (warehouse, item) combination.
inventorySchema.index({ warehouse: 1, item: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
