const express = require("express");
const {
  createStockAdjustment,
  getAllStockAdjustments,
  getStockAdjustmentById,
  updateStockAdjustment,
  deleteStockAdjustment
} = require("../controllers/stockAdjustmentController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE
router.post(
  "/",
  authMiddleware,
  hasPermission("StockAdjustments", "Add"),
  createStockAdjustment
);

// GET ALL
router.get(
  "/",
  authMiddleware,
  hasPermission("StockAdjustments", "View"),
  getAllStockAdjustments
);

// GET SINGLE
router.get(
  "/:id",
  authMiddleware,
  hasPermission("StockAdjustments", "View"),
  getStockAdjustmentById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  hasPermission("StockAdjustments", "Edit"),
  updateStockAdjustment
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("StockAdjustments", "Delete"),
  deleteStockAdjustment
);

module.exports = router;
