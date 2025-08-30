const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  customer : { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  token    : { type: String, required: true },              // FCM / APNs token
  platform : { type: String, enum: ["android", "ios"], required: true },
  updatedAt: { type: Date,   default: Date.now }
});

// one row per (customer, token) — avoids duplicates
schema.index({ customer: 1, token: 1 }, { unique: true });

module.exports = mongoose.model("DeviceToken", schema);
