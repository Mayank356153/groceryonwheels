const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouseName: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: String,
  email: String,
  status: {
    type: String,
    enum: ['Active', 'Restricted', 'Inactive'],
    default: 'Active',
  },

  Latitude: Number,
  Longitude: Number,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },

  // ← link to the cash‐account under this store
  cashAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true     // every warehouse must belong to exactly one store
  },
  // ← terminal ID + QR
  tid: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: String,
  createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',           // can point to Admin or User
    },
    createdByModel: {
      type: String,
      enum: ['Admin', 'User'],
    },

}, { timestamps: true });



warehouseSchema.pre('save', function(next) {
  if (
    (!this.location || !this.location.coordinates || this.location.coordinates.length === 0) &&
    this.Latitude != null && this.Longitude != null
  ) {
    this.location = {
      type: 'Point',
      coordinates: [this.Longitude, this.Latitude]
    };
  }
  next();
});

warehouseSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Warehouse', warehouseSchema);
