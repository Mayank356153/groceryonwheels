const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    image: { type: String, default: '' },       // optional image URL
    features: [{ type: String }],              // optional feature list
    masterImage:String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);