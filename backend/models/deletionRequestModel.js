const mongoose = require("mongoose");

const deletionRequestSchema = new mongoose.Schema(
  {
    itemType:   { type: String, required: true },  // "Warehouse", "Item" …
    itemId:     { type: mongoose.Types.ObjectId, required: true },
    requestedBy:{ type: mongoose.Types.ObjectId, ref: "User", required: true },
    reason:     { type: String },

    status:     { type: String, enum:["PENDING","APPROVED","REJECTED"], default:"PENDING" },
    approvedBy: { type: mongoose.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date }
  },
  { timestamps:true }
);

module.exports = mongoose.model("DeletionRequest", deletionRequestSchema);
