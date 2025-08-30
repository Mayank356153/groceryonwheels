const Variant = require("../models/variantModel");

// CREATE Variant
exports.createVariant = async (req, res) => {
  try {
    const { variantName, description, status } = req.body;

    if (!variantName) {
      return res.status(400).json({ success: false, message: "Variant name is required" });
    }

    const existingVariant = await Variant.findOne({ variantName });
    if (existingVariant) {
      return res.status(400).json({ success: false, message: "Variant name already exists" });
    }

    const newVariant = new Variant({ variantName, description, status });
    await newVariant.save();

    return res.status(201).json({ success: true, message: "Variant created successfully", data: newVariant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Variants
exports.getAllVariants = async (req, res) => {
  try {
    const variants = await Variant.find().sort({ variantName: 1 });
    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Variant
exports.getVariantById = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }
    return res.status(200).json({ success: true, data: variant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Variant
exports.updateVariant = async (req, res) => {
  try {
    const { variantName, description, status } = req.body;

    const updatedVariant = await Variant.findByIdAndUpdate(
      req.params.id,
      { variantName, description, status },
      { new: true }
    );
    if (!updatedVariant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }
    return res.status(200).json({ success: true, message: "Variant updated", data: updatedVariant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Variant
exports.deleteVariant = async (req, res) => {
  try {
    const deletedVariant = await Variant.findByIdAndDelete(req.params.id);
    if (!deletedVariant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }
    return res.status(200).json({ success: true, message: "Variant deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

