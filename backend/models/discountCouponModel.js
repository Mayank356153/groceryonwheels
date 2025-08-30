const mongoose = require("mongoose");

const discountCouponSchema = new mongoose.Schema(
  {
    occasionName: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    couponType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      default: "value",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
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
        minValueRequired: {
             type: Number,
        },
         allowedTimes: { type: Number, default: 1 },
    usedTimes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountCoupon", discountCouponSchema);