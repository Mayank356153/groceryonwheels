// models/terminalModel.js
const mongoose = require('mongoose');

const terminalSchema = new mongoose.Schema({
  tid: {
    type: String,
    required: true,
    unique: true
  },
  qrCodePath: String,
  warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        default: null
      },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Terminal', terminalSchema);
