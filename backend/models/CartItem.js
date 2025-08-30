const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  // Reference the Item model (your item collection)
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  quantity: { type: Number, default: 1, required: true },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CartItem", cartItemSchema);