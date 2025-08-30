const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
    {
      taxName: {
        type: String,
        required: true,
        trim: true,
      },
      taxPercentage: {
        type: Number,
        required: true,
        default: 0,
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
      },
    },
    { timestamps: true }
  );
  module.exports = mongoose.model("Tax", taxSchema);