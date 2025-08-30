
const { time } = require("console");
const mongoose = require("mongoose");




//shipping address model
const shippingAddressSchema=new mongoose.Schema({
     country: {
        type: String,
    },
    state: {
        type: String,
        required: [true, "State is required"],
    },
    city: { 
        type: String,
        required: true,
    },
    houseNo: {
        type: String,
        required: [true, "House Number is required"],
    },
    area: {
        type: String,
        required: [true, "Area is required"],
    },
    postalCode: {  // Important for delivery
        type: String,
        required: true,
    },
    locationLink: String,
},{_id:false})



//order items model
const itemSchema = new mongoose.Schema({
   item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item", 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  salesPrice: { 
    type: Number, 
    required: true 
  }
}, { _id: false });



//order model
const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: [true, "Order ID is required"],
        unique: true,
    },
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer"
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
        default: "Pending",
    },
    
    orderTime: {
        type: Date,
        default: Date.now,
    },
   shippingAddress:{
    type:[shippingAddressSchema],
      required:[true,"shipping address is required"]
   },
    AssignTo: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'AssignToModel',
    },

    AssignToModel: {
        type: String,
        enum: ['Warehouse', 'Store',],
    },

   
    deliveryAgent: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "deliveryAgentModel",
    },

     deliveryAgentModel:{
        type:String,
        enum:["Warehouse","Rider"]
     },
   



    paymentMethod: {
        type: String,
        enum: ["COD", "Credit Card", "Debit Card", "UPI", "Net Banking"],
        required: true,
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Completed", "Failed", "Refunded"],
        default: "Pending",
    },
     razorpayId:{type:String},
  razorpayPaymentId: String,
    razorpaySignature: String,
    paymentVerifiedAt: Date,




    amount: Number,
    tax: {
        type: Number,
        default: 0,
    },
    shippingFee: {
        type: Number,
        default: 0,
    },
    discountApplied: {
        type: Number,
        default: 0,
    },
    finalAmount: Number,
    // couponCode: String,
    // trackingNumber: String,
    // cancellationReason: String,
    notes: String,

 items: [itemSchema],

    unAvailableItems:{
        type:[itemSchema],
        deafult:[]
    },
    allItems:{
        type:[itemSchema],
        deafult:[]
    }
   
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
