const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  label:       { type: String, trim: true },
  street:      { type: String, required: true, trim: true },
  area:        { type: String, trim: true },
  city:        { type: String, required: true, trim: true },
  state:       { type: String, required: true, trim: true },
  country:     { type: String, required: true, trim: true },
  postalCode:  { type: String, required: true, trim: true },
  isDefault:   { type: Boolean, default: false },

  // ── optional GeoJSON point ───────────────────────────────
  location: {
    type:        { type: String, enum: ['Point'] }, 
    coordinates: { type: [Number] }                
  }
}, { timestamps: true });


addressSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Address', addressSchema);
