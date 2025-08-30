const ExpenseCategory = require("../models/expenseCategoryModel");

// CREATE Expense Category
exports.createExpenseCategory = async (req, res) => {
  try {
    const { categoryName, description, status } = req.body;

    if (!categoryName) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    // Check if categoryName already exists
    const existingCategory = await ExpenseCategory.findOne({ categoryName });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category name already exists" });
    }

    const newCategory = new ExpenseCategory({
      categoryName,
      description,
      status: status || "Active",
    });

    await newCategory.save();
    return res.status(201).json({
      success: true,
      message: "Expense Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating expense category:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Expense Categories
exports.getAllExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Expense Category by ID
exports.getExpenseCategoryById = async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Expense category not found" });
    }
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching expense category:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Expense Category
exports.updateExpenseCategory = async (req, res) => {
  try {
    const { categoryName, description, status } = req.body;

    const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { categoryName, description, status },
      { new: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Expense category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Expense category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating expense category:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Expense Category
exports.deleteExpenseCategory = async (req, res) => {
  try {
    const deletedCategory = await ExpenseCategory.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Expense category not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Expense category deleted" });
  } catch (error) {
    console.error("Error deleting expense category:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
