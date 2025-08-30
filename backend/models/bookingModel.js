// models/vanBookingModel.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer:       { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  pickupAddress:  { type: mongoose.Schema.Types.ObjectId, ref: 'Address',  required: true },
  van:            { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },   // assigned van

  type:           { type: String, enum: ['instant','scheduled'], default: 'instant' },
  scheduledFor:   { type: Date },
  remark:         { type: String, trim: true },

  status: {
    type: String,
    enum: ['pending','assigned','accepted','in_transit','completed','cancelled'],
    default: 'pending'
  },

  assignedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt:    { type: Date },
  acceptedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt:    { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.VanBooking
  || mongoose.model('VanBooking', bookingSchema);
