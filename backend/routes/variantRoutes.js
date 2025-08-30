const express = require("express");
const {
  createVariant,
  getAllVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} = require("../controllers/variantController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Variant
router.post(
  "/",
  authMiddleware,
  hasPermission("Variants", "Add"),
  createVariant
);

// GET All Variants
router.get(
  "/",
  authMiddleware,
  hasPermission("Variants", "View"),
  getAllVariants
);

// GET Single Variant
router.get(
  "/:id",
  authMiddleware,
  hasPermission("Variants", "View"),
  getVariantById
);

// UPDATE Variant
router.put(
  "/:id",
  authMiddleware,
  hasPermission("Variants", "Edit"),
  updateVariant
);

// DELETE Variant
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("Variants", "Delete"),
  deleteVariant
);

module.exports = router;
