// models/locationModel.js
const mongoose = require("mongoose");
const locationSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  coords:     {                                  // GeoJSON point
    type:     { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }  // [lng, lat]
  },
  updatedAt:  { type: Date, default: Date.now, index: true }
});
module.exports = mongoose.model("Location", locationSchema);
