const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const SubSubCategory = require("../models/subSubCategoryModel");

// CREATE Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description = "", status = "Active", image = "", features = [] } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const newCat = new Category({ name, description, status, image, features });
    const saved = await newCat.save();
    res.status(201).json({ message: "Category created successfully", data: saved });
  } catch (err) {
    res.status(400).json({ message: "Error creating category", error: err.message });
  }
};

// GET All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.status(200).json({ data: cats });
  } catch (err) {
    res.status(400).json({ message: "Error fetching categories", error: err.message });
  }
};

// GET Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ data: cat });
  } catch (err) {
    res.status(400).json({ message: "Error fetching category", error: err.message });
  }
};

// UPDATE Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status, image, features } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, status, image, features },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category updated", data: updated });
  } catch (err) {
    res.status(400).json({ message: "Error updating category", error: err.message });
  }
};

// DELETE Category
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting category", error: err.message });
  }
};

exports.createCategoriesBulk = async (req, res) => {
  const docs = req.body;              // expect an array of { name, description, status, image, features }
  try {
    const created = await Category.insertMany(docs, { ordered: false });
    return res.status(201).json({
      success: true,
      count: created.length,
      data: created
    });
  } catch (err) {
    const inserted = err.insertedDocs || [];
    return res.status(207).json({      // 207 Multi‑Status
      success: false,
      count: inserted.length,
      error: err.message,
      data: inserted
    });
  }
};


// controllers/subCategoryController.js

// CREATE SubCategory
exports.createSubCategory = async (req, res) => {
  try {
    const { name, description = "", status = "Active", image = "", features = [] } = req.body;
    if (!name) return res.status(400).json({ message: "SubCategory name is required" });

    const newSub = new SubCategory({ name, description, status, image, features });
    const saved = await newSub.save();
    res.status(201).json({ message: "SubCategory created successfully", data: saved });
  } catch (err) {
    res.status(400).json({ message: "Error creating subcategory", error: err.message });
  }
};

// GET All SubCategories
exports.getAllSubCategories = async (req, res) => {
  try {
    const subs = await SubCategory.find().sort({ name: 1 });
    res.status(200).json({ data: subs });
  } catch (err) {
    res.status(400).json({ message: "Error fetching subcategories", error: err.message });
  }
};

// GET SubCategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const sub = await SubCategory.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "SubCategory not found" });
    res.status(200).json({ data: sub });
  } catch (err) {
    res.status(400).json({ message: "Error fetching subcategory", error: err.message });
  }
};

// UPDATE SubCategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { name, description, status, image, features } = req.body;
    const updated = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, status, image, features },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "SubCategory not found" });
    res.status(200).json({ message: "SubCategory updated", data: updated });
  } catch (err) {
    res.status(400).json({ message: "Error updating subcategory", error: err.message });
  }
};

// DELETE SubCategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "SubCategory not found" });
    res.status(200).json({ message: "SubCategory deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting subcategory", error: err.message });
  }
};


// controllers/subCategoryController.js
exports.createSubCategoriesBulk = async (req, res) => {
  const docs = req.body;              // expect an array of { name, description, status, image, features }
  try {
    const created = await SubCategory.insertMany(docs, { ordered: false });
    return res.status(201).json({
      success: true,
      count: created.length,
      data: created
    });
  } catch (err) {
    const inserted = err.insertedDocs || [];
    return res.status(207).json({
      success: false,
      count: inserted.length,
      error: err.message,
      data: inserted
    });
  }
};



// controllers/subSubCategoryController.js

// CREATE SubSubCategory
exports.createSubSubCategory = async (req, res) => {
  try {
    const { name, description = "", status = "Active", images = [], features = [] } = req.body;
    if (!name) return res.status(400).json({ message: "SubSubCategory name is required" });

    const newSS = new SubSubCategory({ name, description, status, images, features });
    const saved = await newSS.save();
    res.status(201).json({ message: "SubSubCategory created successfully", data: saved });
  } catch (err) {
    res.status(400).json({ message: "Error creating sub-subcategory", error: err.message });
  }
};

// GET All SubSubCategories
exports.getAllSubSubCategories = async (req, res) => {
  try {
    const all = await SubSubCategory.find().sort({ name: 1 });
    res.status(200).json({ data: all });
  } catch (err) {
    res.status(400).json({ message: "Error fetching sub-subcategories", error: err.message });
  }
};

// GET SubSubCategory by ID
exports.getSubSubCategoryById = async (req, res) => {
  try {
    const ss = await SubSubCategory.findById(req.params.id);
    if (!ss) return res.status(404).json({ message: "SubSubCategory not found" });
    res.status(200).json({ data: ss });
  } catch (err) {
    res.status(400).json({ message: "Error fetching sub-subcategory", error: err.message });
  }
};

// UPDATE SubSubCategory
exports.updateSubSubCategory = async (req, res) => {
  try {
    const { name, description, status, images, features } = req.body;
    const updated = await SubSubCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, status, images, features },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "SubSubCategory not found" });
    res.status(200).json({ message: "SubSubCategory updated", data: updated });
  } catch (err) {
    res.status(400).json({ message: "Error updating sub-subcategory", error: err.message });
  }
};

// DELETE SubSubCategory
exports.deleteSubSubCategory = async (req, res) => {
  try {
    const deleted = await SubSubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "SubSubCategory not found" });
    res.status(200).json({ message: "SubSubCategory deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting sub-subcategory", error: err.message });
  }
};

// controllers/subSubCategoryController.js
exports.createSubSubCategoriesBulk = async (req, res) => {
  const docs = req.body;              // expect an array of { name, description, status, images, features }
  try {
    const created = await SubSubCategory.insertMany(docs, { ordered: false });
    return res.status(201).json({
      success: true,
      count: created.length,
      data: created
    });
  } catch (err) {
    const inserted = err.insertedDocs || [];
    return res.status(207).json({
      success: false,
      count: inserted.length,
      error: err.message,
      data: inserted
    });
  }
};

// For Categories
exports.uploadCategoryImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    const uploadedImages = {};
    files.forEach(f => {
      uploadedImages[f.originalname] = f.filename;
    });
    res.status(200).json({ success: true, uploadedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// For SubCategories
exports.uploadSubCategoryImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    const uploadedImages = {};
    files.forEach(f => {
      uploadedImages[f.originalname] = f.filename;
    });
    res.status(200).json({ success: true, uploadedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// For Sub-SubCategories
exports.uploadSubSubCategoryImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    const uploadedImages = {};
    files.forEach(f => {
      uploadedImages[f.originalname] = f.filename;
    });
    res.status(200).json({ success: true, uploadedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
