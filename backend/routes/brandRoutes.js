const express = require("express");
const {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Brand
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Brands", "Add")(req, res, next);
  },
  createBrand
);

// GET All Brands
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Brands", "View")(req, res, next);
  },
  getAllBrands
);

// GET Single Brand
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Brands", "View")(req, res, next);
  },
  getBrandById
);

// UPDATE Brand
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Brands", "Edit")(req, res, next);
  },
  updateBrand
);

// DELETE Brand
router.delete(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Brands", "Delete")(req, res, next);
  },
  deleteBrand
);

module.exports = router;
