const express = require("express");
const fs     = require("fs");
const path   = require("path");
const multer = require("multer");
const {
  createSubSubCategory,
  getAllSubSubCategories,
  getSubSubCategoryById,
  updateSubSubCategory,
  deleteSubSubCategory,
  createSubSubCategoriesBulk,
  uploadSubSubCategoryImages,
} = require("../controllers/categoryController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");  

const router = express.Router();
const storageSubSub = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "sub-subcategories");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
const uploadSubSub = multer({ storage: storageSubSub, limits: { fileSize: 1*1024*1024 } });

// New route: POST /api/subsubcategories/upload-images
router.post(
  "/upload-images",
  authMiddleware,
  hasPermission("SubSubCategories","Add"),
  uploadSubSub.array("images", 500),
  uploadSubSubCategoryImages
);

// CREATE SubSubCategory
router.post(
  "/",
  authMiddleware,
  hasPermission("SubSubCategories", "Add"),
  createSubSubCategory
);

// READ ALL SubSubCategories
router.get(
  "/",
  authMiddleware,
  hasPermission("SubSubCategories", "View"),
  getAllSubSubCategories
);
// CREATE SubSubCategories in Bulk
router.post(
    "/bulk",
    authMiddleware,
    hasPermission("SubSubCategories", "Add"),
    createSubSubCategoriesBulk
  );

// READ Single SubSubCategory
router.get(
  "/:id",
  authMiddleware,
  hasPermission("SubSubCategories", "View"),
  getSubSubCategoryById
);

// UPDATE SubSubCategory
router.put(
  "/:id",
  authMiddleware,
  hasPermission("SubSubCategories", "Edit"),
  updateSubSubCategory
);

// DELETE SubSubCategory
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("SubSubCategories", "Delete"),
  deleteSubSubCategory
);



module.exports = router;