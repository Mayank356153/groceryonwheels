const Supplier = require("../models/supplierModel");

// CREATE Supplier
exports.createSupplier = async (req, res) => {
  try {
    const {
      supplierCode,
      supplierName,
      mobile,
      email,
      phone,
      gstNumber,
      taxNumber,
      openingBalance,
      previousBalance,
      purchaseDue,
      purchaseReturnDue,
      country,
      state,
      city,
      postCode,
      address,
      status,
    } = req.body;

    
    if (!supplierName) {
      return res.status(400).json({ success: false, message: "Supplier name is required" });
    }

    const newSupplier = new Supplier({
      supplierCode,
      supplierName,
      mobile,
      email,
      phone,
      gstNumber,
      taxNumber,
      openingBalance,
      previousBalance,
      purchaseDue,
      purchaseReturnDue,
      country,
      state,
      city,
      postCode,
      address,
      status,
    });

    const result = await newSupplier.save();
    res.status(201).json({ success: true, message: "Supplier created successfully", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating supplier", error: error.message });
  }
};

// GET All Suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    
    const suppliers = await Supplier.find().sort({ supplierName: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error fetching suppliers", error: error.message });
  }
};

// GET Single Supplier
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error fetching supplier", error: error.message });
  }
};

// UPDATE Supplier
exports.updateSupplier = async (req, res) => {
  try {
    const {
      supplierCode,
      supplierName,
      mobile,
      email,
      phone,
      gstNumber,
      taxNumber,
      openingBalance,
      previousBalance,
      purchaseDue,
      purchaseReturnDue,
      country,
      state,
      city,
      postCode,
      address,
      status,
    } = req.body;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        supplierCode,
        supplierName,
        mobile,
        email,
        phone,
        gstNumber,
        taxNumber,
        openingBalance,
        previousBalance,
        purchaseDue,
        purchaseReturnDue,
        country,
        state,
        city,
        postCode,
        address,
        status,
      },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, message: "Supplier updated successfully", data: updatedSupplier });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error updating supplier", error: error.message });
  }
};

// DELETE Supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!deletedSupplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error deleting supplier", error: error.message });
  }
};
