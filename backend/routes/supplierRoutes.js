const express = require("express");
const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Supplier
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Suppliers", "Add")(req, res, next);
  },
  createSupplier
);

// GET All Suppliers
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Suppliers", "View")(req, res, next);
  },
  getAllSuppliers
);

// GET Single Supplier
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Suppliers", "View")(req, res, next);
  },
  getSupplierById
);

// UPDATE Supplier
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Suppliers", "Edit")(req, res, next);
  },
  updateSupplier
);

// DELETE Supplier
router.delete(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Suppliers", "Delete")(req, res, next);
  },
  deleteSupplier
);

module.exports = router;
