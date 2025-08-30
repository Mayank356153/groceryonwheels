const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    image: { type: String, default: '' },
    features: [{ type: String }],              // optional feature list
    masterImage:String
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubCategory', subCategorySchema);