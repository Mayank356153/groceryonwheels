const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // Link to the store for which this subscription applies (Store _id)
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store", // Make sure "Store" matches your storeModel export
      required: true,
    },

    // Example fields gleaned from your screenshot:
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    total: {
      type: Number,
      default: 0,
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentType", 
      // or simply a string if you only store "Cash"/"Card", etc.
    },

    // If there's a subscription plan type or status:
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    // If you want subscription date fields, e.g. startDate, endDate, etc.:
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },

    // Any other relevant fields...
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
