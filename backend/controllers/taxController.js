const Tax = require("../models/taxModel");
const TaxGroup = require("../models/taxGroupModel");

/* ==================== TAX CRUD ==================== */

// CREATE a new Tax
exports.createTax = async (req, res) => {
  try {
    const { taxName, taxPercentage, status } = req.body;
    
    const newTax = new Tax({
      taxName,
      taxPercentage,
      status,
    });

    const savedTax = await newTax.save();
    res.status(201).json({
      message: "Tax created successfully",
      data: savedTax,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create tax", error: error.message });
  }
};

// GET all Taxes
exports.getAllTaxes = async (req, res) => {
  try {
    const taxes = await Tax.find();
    res.status(200).json({
      message: "Taxes retrieved successfully",
      data: taxes,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve taxes", error: error.message });
  }
};

// GET a single Tax by ID
exports.getTaxById = async (req, res) => {
  try {
    const { id } = req.params;
    const tax = await Tax.findById(id);
    if (!tax) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.status(200).json({ data: tax });
  } catch (error) {
    res.status(500).json({ message: "Failed to get tax", error: error.message });
  }
};

// UPDATE a Tax
exports.updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { taxName, taxPercentage, status } = req.body;

    const updatedTax = await Tax.findByIdAndUpdate(
      id,
      { taxName, taxPercentage, status },
      { new: true }
    );

    if (!updatedTax) {
      return res.status(404).json({ message: "Tax not found" });
    }

    res.status(200).json({
      message: "Tax updated successfully",
      data: updatedTax,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update tax", error: error.message });
  }
};

// DELETE a Tax
exports.deleteTax = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTax = await Tax.findByIdAndDelete(id);
    if (!deletedTax) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.status(200).json({
      message: "Tax deleted successfully",
      data: deletedTax,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tax", error: error.message });
  }
};

/* ==================== TAX GROUP CRUD ==================== */

// CREATE a new Tax Group
exports.createTaxGroup = async (req, res) => {
  try {
    const { groupName, taxes, status } = req.body;
    
    const newTaxGroup = new TaxGroup({
      groupName,
      taxes, // array of Tax _ids
      status,
    });

    const savedTaxGroup = await newTaxGroup.save();
    res.status(201).json({
      message: "Tax Group created successfully",
      data: savedTaxGroup,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create tax group", error: error.message });
  }
};

// GET all Tax Groups
exports.getAllTaxGroups = async (req, res) => {
  try {
    // Populate the taxes field if you need detailed tax info
    const taxGroups = await TaxGroup.find().populate("taxes");
    res.status(200).json({
      message: "Tax Groups retrieved successfully",
      data: taxGroups,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve tax groups", error: error.message });
  }
};

// GET a single Tax Group by ID
exports.getTaxGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const taxGroup = await TaxGroup.findById(id).populate("taxes");
    if (!taxGroup) {
      return res.status(404).json({ message: "Tax Group not found" });
    }
    res.status(200).json({ data: taxGroup });
  } catch (error) {
    res.status(500).json({ message: "Failed to get tax group", error: error.message });
  }
};

// UPDATE a Tax Group
exports.updateTaxGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, taxes, status } = req.body;

    const updatedGroup = await TaxGroup.findByIdAndUpdate(
      id,
      { groupName, taxes, status },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Tax Group not found" });
    }

    res.status(200).json({
      message: "Tax Group updated successfully",
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update tax group", error: error.message });
  }
};

// DELETE a Tax Group
exports.deleteTaxGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await TaxGroup.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ message: "Tax Group not found" });
    }
    res.status(200).json({
      message: "Tax Group deleted successfully",
      data: deletedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tax group", error: error.message });
  }
};
