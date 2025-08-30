const express = require("express");
const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require("../controllers/unitController");

const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Unit
router.post("/units", authMiddleware, hasPermission("Units", "Add"), createUnit);

// GET All Units (with optional search query)
router.get("/units", authMiddleware, hasPermission("Units", "View"), getAllUnits);

// GET Single Unit by ID
router.get("/units/:id", authMiddleware, hasPermission("Units", "View"), getUnitById);

// UPDATE Unit
router.put("/units/:id", authMiddleware, hasPermission("Units", "Edit"), updateUnit);

// DELETE Unit
router.delete("/units/:id", authMiddleware, hasPermission("Units", "Delete"), deleteUnit);

module.exports = router;
