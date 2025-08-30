const Brand = require("../models/brandModel");

// CREATE Brand
exports.createBrand = async (req, res) => {
  try {
    const { brandName, description, status } = req.body;

    
    if (!brandName) {
      return res.status(400).json({ success: false, message: "Brand name is required" });
    }

    
    const existingBrand = await Brand.findOne({ brandName });
    if (existingBrand) {
      return res.status(400).json({ success: false, message: "Brand name already exists" });
    }

    const newBrand = new Brand({ brandName, description, status });
    await newBrand.save();

    return res.status(201).json({ success: true, message: "Brand created successfully", data: newBrand });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ brandName: 1 });
    return res.status(200).json({ success: true, data: brands });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Brand
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    return res.status(200).json({ success: true, data: brand });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Brand
exports.updateBrand = async (req, res) => {
  try {
    const { brandName, description, status } = req.body;

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      { brandName, description, status },
      { new: true }
    );
    if (!updatedBrand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    return res.status(200).json({ success: true, message: "Brand updated", data: updatedBrand });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Brand
exports.deleteBrand = async (req, res) => {
  try {
    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
    if (!deletedBrand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    return res.status(200).json({ success: true, message: "Brand deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
