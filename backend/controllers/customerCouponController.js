const CustomerCoupon = require("../models/customerCouponModel");
const CustomerData = require("../models/customerDataModel");
const Customer = require("../models/customerModel");
const DiscountCoupon = require("../models/discountCouponModel");

exports.createCustomerCoupon = async (req, res) => {
  try {
    const {
      customerData,
      appCustomer,
      discountCoupon,
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
      usedDate = null, // Add default value
      status = "Active" // Add default status
    } = req.body;

    // Required field validation
    customerData.forEach(customer => {
      if (!customer ) {   
        return res.status(400).json({ message: "One the customer not exist" });
      }
    });

    // Numeric field validation
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

    // Validate references
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: "Customer not found!" });
    }

    // Create a new customer coupon
    const newCustomerCoupon = new CustomerCoupon({
      customerData: customerData || undefined,
      appCustomer: appCustomer || undefined,
      discountCoupon,
      couponCode: couponCode || discountCoupon.code, // default to main coupon code if not provided
      occasionName,
      expiryDate,
      value,
      usedDate,
      status,
      couponType,
      description,
      minCartValue: minCartValue ? Number(minCartValue) : undefined,
      allowedTimes: allowedTimes ? Number(allowedTimes) : undefined,
      itemsAllowed,
      categoryAllowed, 
      subCategoryAllowed,
      subsubCategoryAllowed,
    });

    await newCustomerCoupon.save();
    res.status(201).json({ message: "Customer coupon created!", customerCoupon: newCustomerCoupon });
  } catch (error) {
    console.error("Error creating customer coupon:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};





exports.getAllCustomerCoupons = async (req, res) => {
  try {
   const customerCoupons = await CustomerCoupon.find()
  .populate('customer')
  .populate('discountCoupon')
  .populate('itemsAllowed')
  .populate('categoryAllowed')
  .populate('subCategoryAllowed')
  .sort({ createdAt: -1 });
 // Sort by creation date, newest first
    res.status(200).json(customerCoupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// READ ONE
exports.getCustomerCouponById = async (req, res) => {
  try {
    const coupon = await CustomerCoupon.findById(req.params.id)
      .populate("customerData appCustomer discountCoupon");
    if (!coupon) {
      return res.status(404).json({ message: "Customer coupon not found!" });
    }
    res.status(200).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateCustomerCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CustomerCoupon.findByIdAndUpdate(id, req.body, { new: true })
      .populate("customerData appCustomer discountCoupon");
    if (!updated) {
      return res.status(404).json({ message: "Customer coupon not found!" });
    }
    res.status(200).json({ message: "Customer coupon updated!", customerCoupon: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE
exports.deleteCustomerCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await CustomerCoupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Customer coupon not found!" });
    }
    res.status(200).json({ message: "Customer coupon deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};