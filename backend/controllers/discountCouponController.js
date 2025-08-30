const DiscountCoupon = require("../models/discountCouponModel");


// exports.createDiscountCoupon = async (req, res) => {
//   try {
//     const {
//       couponCode,
//       occasionName,
//       expiryDate,
//       value,
//       minCartValue,
//       allowedTimes,
//       couponType,
//       description,
//       itemsAllowed,
//       categoryAllowed,  
//       subCategoryAllowed,
//       subsubCategoryAllowed,
//       usedDate = null, // Add default value

//     } = req.body;

    
//     if (!occasionName || !couponCode || !expiryDate || !value) {
//       return res.status(400).json({ message: "Missing required fields!" });
//     }

    
//     const newCoupon = new DiscountCoupon({
//       occasionName,
//       couponCode,
//       expiryDate,
//       value,
//       couponType: couponType || "value",
//       description: description || "",
//       status: status || "Active",
//     });

//     await newCoupon.save();
//     res.status(201).json({ message: "Discount coupon created!", coupon: newCoupon });
//   } catch (error) {
//     console.error(error);
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Coupon code must be unique!" });
//     }
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// READ ALL
exports.createDiscountCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      occasionName,
      expiryDate,
      value,
      minCartValue,
      allowedTimes,
      couponType,
      description,
      itemsAllowed,
      categoryAllowed,  
      subCategoryAllowed,
      subsubCategoryAllowed,
      usedDate = null,
      status = "Active" // Added default value
    } = req.body;

    // Required field validation
    if (!occasionName || !couponCode || !expiryDate || !value) {
      return res.status(400).json({ 
        message: "Missing required fields! Occasion name, coupon code, expiry date, and value are required." 
      });
    }

    // Numeric validation
    if (isNaN(Number(value))) {
      return res.status(400).json({ message: "Value must be a number!" });
    }
    if (minCartValue && isNaN(Number(minCartValue))) {
      return res.status(400).json({ message: "Minimum cart value must be a number!" });
    }
    if (allowedTimes && isNaN(Number(allowedTimes))) {
      return res.status(400).json({ message: "Allowed times must be a number!" });
    }

    // Array validation
    const validateArray = (field, name) => {
      if (field && !Array.isArray(field)) {
        return res.status(400).json({ message: `${name} must be an array!` });
      }
    };

    validateArray(itemsAllowed, "Items allowed");
    validateArray(categoryAllowed, "Category allowed");
    validateArray(subCategoryAllowed, "Sub-category allowed");
    validateArray(subsubCategoryAllowed, "Sub-sub-category allowed");

    // Create new coupon
    const newCoupon = new DiscountCoupon({
      occasionName,
      expiryDate,
      value: Number(value),
      minCartValue: minCartValue ? Number(minCartValue) : undefined,
      allowedTimes: allowedTimes ? Number(allowedTimes) : undefined,
      couponType: couponType || "value",
      description: description || "",
      status,
      itemsAllowed,
      categoryAllowed,
      subCategoryAllowed,
      subsubCategoryAllowed,
      usedDate
    });

    await newCoupon.save();
    res.status(201).json({ 
      message: "Discount coupon created successfully!", 
      coupon: newCoupon 
    });
  } catch (error) {
    console.error("Error creating discount coupon:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Coupon code must be unique! This coupon code already exists." 
      });
    }
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};


exports.getAllDiscountCoupons = async (req, res) => {
  try {
    const coupons = await DiscountCoupon.find()
  .populate('itemsAllowed')
  .populate('categoryAllowed')
  .populate('subCategoryAllowed')
  .sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// READ ONE
exports.getDiscountCouponById = async (req, res) => {
  try {
    const coupon = await DiscountCoupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found!" });
    }
    res.status(200).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateDiscountCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DiscountCoupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Coupon not found!" });
    }
    res.status(200).json({ message: "Coupon updated!", coupon: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE
exports.deleteDiscountCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await DiscountCoupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found!" });
    }
    res.status(200).json({ message: "Coupon deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};