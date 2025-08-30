const PaymentType = require("../models/paymentTypeModel");

// CREATE a new Payment Type
exports.createPaymentType = async (req, res) => {
  try {
    const { paymentTypeName, status } = req.body;
    if (!paymentTypeName) {
      return res.status(400).json({ message: "Payment Type Name is required" });
    }
    
    const newPaymentType = new PaymentType({
      paymentTypeName,
      status: status || "active",
    });

    const savedPaymentType = await newPaymentType.save();
    res.status(201).json({
      message: "Payment Type created successfully",
      data: savedPaymentType,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create payment type", error: error.message });
  }
};

// GET all Payment Types
exports.getAllPaymentTypes = async (req, res) => {
  try {
    const searchQuery = req.query.search
      ? { paymentTypeName: { $regex: req.query.search, $options: "i" } }
      : {};
    
    const paymentTypes = await PaymentType.find(searchQuery);
    res.status(200).json({
      message: "Payment Types retrieved successfully",
      data: paymentTypes,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve payment types", error: error.message });
  }
};

// GET a single Payment Type by ID
exports.getPaymentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentType = await PaymentType.findById(id);
    if (!paymentType) {
      return res.status(404).json({ message: "Payment Type not found" });
    }
    res.status(200).json({ data: paymentType });
  } catch (error) {
    res.status(500).json({ message: "Failed to get payment type", error: error.message });
  }
};

// UPDATE a Payment Type
exports.updatePaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentTypeName, status } = req.body;

    const updatedPaymentType = await PaymentType.findByIdAndUpdate(
      id,
      { paymentTypeName, status },
      { new: true }
    );

    if (!updatedPaymentType) {
      return res.status(404).json({ message: "Payment Type not found" });
    }

    res.status(200).json({
      message: "Payment Type updated successfully",
      data: updatedPaymentType,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update payment type", error: error.message });
  }
};

// DELETE a Payment Type
exports.deletePaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPaymentType = await PaymentType.findByIdAndDelete(id);
    if (!deletedPaymentType) {
      return res.status(404).json({ message: "Payment Type not found" });
    }
    res.status(200).json({
      message: "Payment Type deleted successfully",
      data: deletedPaymentType,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete payment type", error: error.message });
  }
};
