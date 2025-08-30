const mongoose = require("mongoose"); // Import mongoose library

// Define the schema for each item in a checkout session
const checkoutItemSchema = new mongoose.Schema({
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item", // Reference to the Item model
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true // Quantity of the item being purchased
  },
  salesPrice: { 
    type: Number, 
    required: true // Sales price at the time of checkout (snapshot of price)
  }
});

// Define the schema for a complete checkout session
const checkoutSessionSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", // Reference to the Customer model
    required: true 
  },
  items: { 
    type: [checkoutItemSchema], 
    required: true // Array of items in the checkout session
  },
  amount: { 
    type: Number, 
    required: true // Total amount for the session
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "expired"], // Session status
    default: "pending" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Timestamp for session creation
  },
  expiresAt: { 
    type: Date, 
    default: () => Date.now() + 60 * 60 * 1000 // Session expiration time (1 hour)
  },
  razorpayId: { 
    type: String // Razorpay order ID
  },
  razorpayPaymentId: String, // Razorpay payment ID (after payment is made)
  razorpaySignature: String, // Signature for verifying Razorpay payment
  paymentVerifiedAt: Date // Timestamp when payment was verified
});

// Export the model as 'CheckoutSession'
module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
