const mongoose = require("mongoose");

const subSubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    images: [{ type: String }],                  // multiple image URLs
    features: [{ type: String }],                // optional feature list
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubSubCategory', subSubCategorySchema);