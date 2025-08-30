const Service = require("../models/serviceModel");
const Category = require("../models/categoryModel");
const Tax = require("../models/taxModel"); 

exports.createService = async (req, res) => {
  try {
    const {
      itemCode,
      itemName,
      category,
      barcode,
      sac,
      hsn,
      sellerPoints,
      description,
      discountType,
      discount,
      priceWithoutTax,
      tax,
      salesTaxType,
      salesPrice,
      serviceImage,
    } = req.body;

    
    if (!itemCode || !itemName || !category || !priceWithoutTax || !salesPrice || !salesTaxType) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newService = new Service({
      itemCode,
      itemName,
      category, 
      barcode,
      sac,
      hsn,
      sellerPoints: sellerPoints || 0, 
      description,
      discountType: discountType || "Percentage", 
      discount: discount || 0, 
      priceWithoutTax,
      tax, 
      salesTaxType,
      salesPrice,
      serviceImage,
    });

    await newService.save();
    res.status(201).json({ success: true, message: "Service created successfully", data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("category", "name description")
      .populate("tax", "taxName taxPercentage");
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("category", "name description")
      .populate("tax", "taxName taxPercentage");
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update a service
exports.updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service updated successfully", data: updatedService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete a service
exports.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
