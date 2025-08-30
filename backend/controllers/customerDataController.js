const CustomerData = require("../models/customerDataModel");

// Create a new customer data record
exports.createCustomerData = async (req, res) => {
  try {
    const {
      customerName,
      mobile,
      type,
      phone,
      email,
      gstNumber,
      panNumber,
      taxNumber,
      creditLimit,
      previousDue,
      attachmentPath,
      customerImage,
      // ADVANCED FIELDS
      priceLevelType,
      priceLevel,
      openingBalancePayments,
      advanceBalance,
    } = req.body;
    
    // Use nested objects if provided, or fall back to individual fields if necessary
    const address = req.body.address || {
      country: req.body.country,
      city: req.body.city,
      area: req.body.area,
      state: req.body.state,
      postcode: req.body.postcode,
      locationLink: req.body.locationLink,
    };
    
    const shippingAddress = req.body.shippingAddress || {
      country: req.body.shippingcountry,
      city: req.body.shippingCity,
      area: req.body.shippingArea,
      state: req.body.shippingState,
      postcode: req.body.shippingPostcode,
      locationLink: req.body.shippingLocationLink,
    };
    
    const newCustomerData = new CustomerData({
      customerName,
      mobile,
      phone,
      email,
      type:type || "Offline",
      gstNumber,
      panNumber,
      taxNumber,
      creditLimit,
      previousDue,
      attachmentPath: attachmentPath || "",
      customerImage: customerImage || "",
      address, // Save the nested address object
      shippingAddress, // Save the nested shipping address object
      priceLevelType: priceLevelType || "Increase",
      priceLevel: priceLevel || 0,
      openingBalancePayments: openingBalancePayments || [],
      advanceBalance: advanceBalance || 0,
    });
    
    await newCustomerData.save();
    res.status(201).json({
      message: "Customer data created successfully",
      data: newCustomerData,
    });
  } catch (error) {
    console.error("Error creating customer data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update a customer data record
exports.updateCustomerData = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract the common fields (assuming the nested objects come in as is)
    const {
      customerName,
      mobile,
      phone,
      email,
      gstNumber,
      panNumber,
      taxNumber,
      creditLimit,
      previousDue,
      attachmentPath,
      customerImage,
      // ADVANCED FIELDS
      priceLevelType,
      priceLevel,
      openingBalancePayments,
    } = req.body;

    // Use nested objects directly if available, or fallback to flat destructuring
    const address = req.body.address || {
      country: req.body.country,
      city: req.body.city,
      area: req.body.area,
      state: req.body.state,
      postcode: req.body.postcode,
      locationLink: req.body.locationLink,
    };

    const shippingAddress = req.body.shippingAddress || {
      country: req.body.shippingcountry,
      city: req.body.shippingCity,
      area: req.body.shippingArea,
      state: req.body.shippingState,
      postcode: req.body.shippingPostcode,
      locationLink: req.body.shippingLocationLink,
    };

    // Build updated data object
    const updatedData = {
      customerName,
      mobile,
      phone,
      email,
      gstNumber,
      panNumber,
      taxNumber,
      creditLimit,
      previousDue,
      attachmentPath,
      customerImage: customerImage || "",
      address,
      shippingAddress,
      priceLevelType: priceLevelType || "Increase",
      priceLevel: priceLevel || 0,
      openingBalancePayments: openingBalancePayments || [],
    };

    const customer = await CustomerData.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer data not found" });
    }
    res.status(200).json({
      message: "Customer data updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error updating customer data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ata records
exports.getAllCustomerData = async (req, res) => {
  try {
    
    const customers = await CustomerData.find()
      .sort({ createdAt: -1 })
      .populate("openingBalancePayments.paymentType");
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customer data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getCustomerDataById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await CustomerData.findById(id).populate(
      "openingBalancePayments.paymentType"
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer data not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error("Error fetching customer data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a customer data record
exports.deleteCustomerData = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerData.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer data not found" });
    }
    res.status(200).json({ message: "Customer data deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
