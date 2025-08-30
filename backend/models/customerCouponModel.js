const mongoose = require("mongoose");

const customerCouponSchema = new mongoose.Schema(
  {
    customerData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerData",
      },
    ],
    appCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    discountCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountCoupon",
      
    },
    
    couponCode: { type: String, default: "" },

   
  

    status: {
      type: String,
      enum: ["Active", "Used", "Expired"],
      default: "Active",
    },
    
    occasionName: { type: String, default: "" },
    expiryDate: { type: Date }, 
    value: { type: Number }, 
    minCartValue: { type: Number, default: 0 },
    allowedTimes: { type: Number, default: 1 },
    usedTimes: { type: Number, default: 0 },
     
    couponType: { type: String, enum: ["Percentage", "Fixed"],required:[true,"coupon type is required"] },
    description: { type: String, default: "" },
    itemsAllowed:[{
    type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: []
    }],
    categoryAllowed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: []
    }],
    subCategoryAllowed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: []
    }],
    subsubCategoryAllowed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubCategory",
      default: []
    }],
  },
  { timestamps: true }
);

// Add a custom validator to ensure at least one customer reference is provided
customerCouponSchema.pre('validate', function(next) {
  if (!this.customerData && !this.appCustomer) {
    return next(new Error('Either customerData or appCustomer is required!'));
  }
  next();
});

module.exports = mongoose.model("CustomerCoupon", customerCouponSchema);