const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    stateName: {
      type: String,
      required: true,
      trim: true,
    },
    // Reference to Country (each state must belong to a country)
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("State", stateSchema);
