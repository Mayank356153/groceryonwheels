const express = require("express");
const router = express.Router();
const salesReturnController = require("../controllers/salesReturnController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// Create a new return
router.post("/", authMiddleware, hasPermission("SalesReturn", "Add"), salesReturnController.createReturn);

// Get all returns
router.get("/", authMiddleware, hasPermission("SalesReturn", "View"), salesReturnController.getAllReturns);

// Get single return
router.get("/:id", authMiddleware, hasPermission("SalesReturn", "View"), salesReturnController.getReturnById);

// Update return
router.put("/:id", authMiddleware, hasPermission("SalesReturn", "Edit"), salesReturnController.updateReturn);

// Delete return
router.delete("/:id", authMiddleware, hasPermission("SalesReturn", "Delete"), salesReturnController.deleteReturn);

module.exports = router;
