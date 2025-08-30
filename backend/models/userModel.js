const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  FirstName: {
    type: String,
    required: true,
    trim: true
  },
  LastName: {
    type: String,
    required: true,
    trim: true
  },
  Mobile: {
    type: String,
    required: true,
    trim: true
  },
  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  Role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  Password: {
    type: String,
    required: true
  },
  WarehouseGroup: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: 'Warehouse',
  validate: {
    validator: v => Array.isArray(v) && v.length > 0,
    message: 'At least one Warehouse is required'
  },
},
Defaultwarehouse: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Warehouse',
  required: [true, 'Default Warehouse is required'],
},
  Store: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
