const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    barcode: { type: String },
    sac: { type: String }, 
    hsn: { type: String }, 
    sellerPoints: { type: Number, default: 0 },
    description: { type: String },
    discountType: { type: String, enum: ["Percentage", "Fixed"], default: "Percentage" },
    discount: { type: Number, default: 0 },
    priceWithoutTax: { type: Number, required: true },
    tax: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
    salesTaxType: { type: String, enum: ["Inclusive", "Exclusive"], required: true },
    salesPrice: { type: Number, required: true },
    serviceImage: { type: String }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
