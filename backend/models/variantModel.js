// models/variantModel.js
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  variantName: { type: String, required: true, unique: true },
  description: { type: String },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// ← Check if it’s already been registered; if so, use that, else define it.
const Variant = mongoose.models.Variant 
  ? mongoose.model('Variant') 
  : mongoose.model('Variant', variantSchema);

module.exports = Variant;
