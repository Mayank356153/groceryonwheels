const mongoose = require("mongoose");

// Define schema for an individual audit bucket
const bucketSchema = new mongoose.Schema(
  {
    // Reference to the auditor (user who scanned the items)
    auditorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditUser", // Refers to the AuditUser collection
    },

    // Array of scanned items
    items: [
      {
        // Reference to the scanned item
        item_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item", // Refers to the Item collection
        },
        // Quantity of the item scanned by the auditor
        quantity: {
          type: Number,
          default: 1, // Default quantity if not provided
        },
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Export the model as "AuditBucket"
module.exports = mongoose.model("AuditBucket", bucketSchema);
