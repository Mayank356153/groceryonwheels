// models/counterModel.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id : { type: String, required: true },   // sequence name goes here
  seq : { type: Number, default: 0 }
});

module.exports = mongoose.model("Counter", counterSchema);
