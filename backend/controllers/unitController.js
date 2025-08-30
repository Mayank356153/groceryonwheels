const Unit = require("../models/unitModel");


// CREATE a new Unit
exports.createUnit = async (req, res) => {
  try {
    const { unitName, description, status } = req.body;

    if (!unitName) {
      return res.status(400).json({ message: "Unit Name is required" });
    }

    const newUnit = new Unit({
      unitName,
      description,
      status: status || "active",
    });

    const savedUnit = await newUnit.save();
    res.status(201).json({
      message: "Unit created successfully",
      data: savedUnit,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create unit", error: error.message });
  }
};

// GET all Units
exports.getAllUnits = async (req, res) => {
  try {
    const searchQuery = req.query.search
      ? { unitName: { $regex: req.query.search, $options: "i" } }
      : {};

    const units = await Unit.find(searchQuery);
    res.status(200).json({
      message: "Units retrieved successfully",
      data: units,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve units", error: error.message });
  }
};

// GET a single Unit by ID
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.status(200).json({ data: unit });
  } catch (error) {
    res.status(500).json({ message: "Failed to get unit", error: error.message });
  }
};

// UPDATE a Unit
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unitName, description, status } = req.body;

    const updatedUnit = await Unit.findByIdAndUpdate(
      id,
      { unitName, description, status },
      { new: true }
    );

    if (!updatedUnit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.status(200).json({
      message: "Unit updated successfully",
      data: updatedUnit,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update unit", error: error.message });
  }
};

// DELETE a Unit
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUnit = await Unit.findByIdAndDelete(id);
    if (!deletedUnit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.status(200).json({
      message: "Unit deleted successfully",
      data: deletedUnit,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete unit", error: error.message });
  }
};
