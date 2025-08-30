// routes/categoryRoutes.js
const express = require("express");
const multer  = require("multer");
const fs     = require("fs");
const path   = require("path");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createCategoriesBulk,
  uploadCategoryImages
 
} = require("../controllers/categoryController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

const storageCat = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "categories");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
const uploadCat = multer({ storage: storageCat, limits: { fileSize: 1*1024*1024 } });

// New route: POST /api/categories/upload-images
router.post(
  "/upload-images",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase()==="admin") return next();
    return hasPermission("Categories","Add")(req,res,next);
  },
  uploadCat.array("images", 50),
  uploadCategoryImages
);


router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "Add")(req, res, next);
  },
  createCategory
);

// READ ALL Categories
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "View")(req, res, next);
  },
  getAllCategories
);
router.post(
  "/bulk",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "Add")(req, res, next);
  },
  createCategoriesBulk
);

// READ Single Category
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "View")(req, res, next);
  },
  getCategoryById
);

// UPDATE Category
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "Edit")(req, res, next);
  },
  updateCategory
);

// DELETE Category
router.delete(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Categories", "Delete")(req, res, next);
  },
  deleteCategory
);




module.exports = router;
