const mongoose = require("mongoose");

const taxGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    // An array of Tax references
    taxes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tax",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxGroup", taxGroupSchema);
