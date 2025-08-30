// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    unique: true, 
    required: true 
  },
  name: { type: String },
  email: { type: String },      // <-- no longer "unique: true, sparse: true"
  city: { type: String },
  state: { type: String },
  country: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
}, {
  timestamps: true,
});

// Create a partial unique index on email
// This ensures if 'email' is set (and non-null), it must be unique.
customerSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model("Customer", customerSchema);
