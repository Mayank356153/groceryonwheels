// routes/subcategoryRoutes.js
const express = require("express");
const fs     = require("fs");
const path   = require("path");
const multer = require("multer");
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  createSubCategoriesBulk,
  uploadSubCategoryImages,
} = require("../controllers/categoryController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();
const storageSub = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "subcategories");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
const uploadSub = multer({ storage: storageSub, limits: { fileSize: 1*1024*1024 } });

// New route: POST /api/subcategories/upload-images
router.post(
  "/upload-images",
  authMiddleware,
  hasPermission("SubCategories","Add"),
  uploadSub.array("images", 50),
  uploadSubCategoryImages
);

// CREATE SubCategory
router.post(
  "/",
  authMiddleware,
  hasPermission("SubCategories", "Add"),
  createSubCategory
);

// READ ALL SubCategories
router.get(
  "/",
  authMiddleware,
  hasPermission("SubCategories", "View"),
  getAllSubCategories
);
router.post(
  "/bulk",
  authMiddleware,
  hasPermission("SubCategories", "Add"),
  createSubCategoriesBulk
);

// READ Single SubCategory
router.get(
  "/:id",
  authMiddleware,
  hasPermission("SubCategories", "View"),
  getSubCategoryById
);

// UPDATE SubCategory
router.put(
  "/:id",
  authMiddleware,
  hasPermission("SubCategories", "Edit"),
  updateSubCategory
);

// DELETE SubCategory
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("SubCategories", "Delete"),
  deleteSubCategory
);

// CREATE SubCategories in Bulk

module.exports = router;
