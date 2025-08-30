// models/WishlistItem.js
const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  // Reference the Item model instead of "Product"
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WishlistItem", wishlistItemSchema);
