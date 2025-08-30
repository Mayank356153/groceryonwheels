// routes/itemRoutes.js
const fs = require('fs');
const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  createItem,
  createItemBySQL,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemSummaries,
  getItemsNearLocation,
  getRelatedItems,
  getTopTrendingItems,
  getLowStockItems,
  getItemsByCategory,
  createItemsBulk,
  uploadImages,
  deleteItemImage, // Add the new controller
  assignMasterImage,
  DifferentiateItemByCategory,
  getCategoryWiseImages,
  generateMergedImagesForCategory, // Add the new controller
   getMergedSubCategoryImages,
   generateMergedImagesForSubCategory,
   getMergedSubSubCategoryImages,
  generateMergedImagesForSubSubCategory,
  DifferentiateItemBysubCategory,
  DifferentiateItemBysubsubCategory,
  assignMasterImageForCategory,
  getMergedCategoryImages,
  getItems,
  getItemsByWarehouse,
  assignMasterImageForSubCategory,
  autocomplete,updateItemFromPurchase,updateSalesPrice
  
} = require("../controllers/itemController");
const { fetchImagesFromS3 } = require('../helpers/s3Utils'); // Updated import
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
const { protect } = require("../middleware/customerauthMiddleware");
const { auth } = require('firebase-admin');

const router = express.Router();

// ─── Multer storage ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '..', 'uploads', 'qr', 'items');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 1 MB limit per file
  files: 20000
});

// ─── Routes ────────────────────────────────────────────────────

router.get("/items/all",getItemsByWarehouse)
router.get('/items/search', autocomplete);

router.put("/items/updateSalesPrice",authMiddleware,  (req, res, next) =>
    req.user.role.toLowerCase() === 'admin'
      ? next()
      : hasPermission('Items', 'Edit')(req, res, next),updateSalesPrice)
//category
router.get("/items/getWithCategory",DifferentiateItemByCategory)

router.get("/items/getImageByCategory",getMergedCategoryImages)

router.get("/items/category/getImageForCategory",generateMergedImagesForCategory)


//sub 

router.get("/items/getWithsubCategory",DifferentiateItemBysubCategory)

router.get("/items/getImageBySubCategory",getMergedSubCategoryImages)

router.get("/items/subcategory/getImageForsubCategory",generateMergedImagesForSubCategory)


//subsub
router.get("/items/getWithsubsubCategory",DifferentiateItemBysubsubCategory)

router.get("/items/getImageBySubSubCategory",getMergedSubSubCategoryImages)

router.get("/items/subsubcategory/getImageForsubSubCategory",generateMergedImagesForSubSubCategory)


router.post(
  '/items/pull-images',
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === 'admin'
      ? next()
      : hasPermission('Items', 'Add')(req, res, next),
  express.json(),          // parse JSON body
  fetchImagesFromS3
);

// New route for uploading images (up to 50 files)
router.post(
  "/items/upload-images",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Add")(req, res, next),
  upload.array("itemImages", 20000), // Allow up to 50 images
  uploadImages
);

router.get("/items/available-images", (req, res) => {
  const dir = path.resolve(__dirname, "..", "uploads", "qr", "items");
  const files = fs.readdirSync(dir);
  const map = {};
  files.forEach(f => (map[f] = f)); // key = original server name
  res.json(map);
});


router.put("/items/updateFromPurchase",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Edit")(req, res, next),
  updateItemFromPurchase
)


router.post(
  "/items/create/sql",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Add")(req, res, next),
  upload.none(),
  createItemBySQL
);

// Create item (up to 5 files under field name "itemImages")
router.post(
  "/items",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Add")(req, res, next),
  upload.array("itemImages", 10),
  createItem
);

router.get(
  "/items/audit",
  getItems
);

// Get all (flattened) items
router.get(
  "/items",
  authMiddleware,
  (req, res, next) =>
    req.user.role?.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getAllItems
);

// Get item summaries
router.get(
  "/items/summary",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getItemSummaries
);

// Items near location
router.get(
  "/items/near",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getItemsNearLocation
);

// Top trending
router.get(
  "/items/top-trending",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getTopTrendingItems
);

// Low stock
router.get(
  "/items/low-stock",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getLowStockItems
);

// Bulk insert
router.post(
  "/items/bulk",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Add")(req, res, next),
  createItemsBulk
);

// By category
router.get(
  "/items/category/:categoryId",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getItemsByCategory
);

// Related items (public)
router.get("/items/:id/related", protect, getRelatedItems);

// Single item
router.get(
  "/items/:id",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "View")(req, res, next),
  getItemById
);

// Update item (also accept new images)
router.put(
  "/items/:id",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Edit")(req, res, next),
  upload.array("itemImages", 5),
  updateItem
);

// Delete item
router.delete(
  "/items/:id",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Delete")(req, res, next),
  deleteItem
);
router.delete(
  "/items/:id/images/:filename",
  authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Edit")(req, res, next),
  deleteItemImage
);

//assign master image

router.put("/items/assign/master_image", authMiddleware,
  (req, res, next) =>
    req.user.role.toLowerCase() === "admin"
      ? next()
      : hasPermission("Items", "Edit")(req, res, next),assignMasterImage)





router.put("/category/assign/master-image",
   authMiddleware,assignMasterImageForCategory)

   router.put("/subcategories/assign/master-image",authMiddleware,assignMasterImageForSubCategory);

   router.put("/subsubcategory/assign-masterImage",
         authMiddleware
    ,generateMergedImagesForSubSubCategory)


module.exports = router;