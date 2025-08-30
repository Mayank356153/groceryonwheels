const mongoose = require("mongoose");

const paymentTypeSchema = new mongoose.Schema(
  {
    paymentTypeName: {
      type: String,
      required: true,
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

module.exports = mongoose.model("PaymentType", paymentTypeSchema);
