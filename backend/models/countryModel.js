const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    countryName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Country", countrySchema);
