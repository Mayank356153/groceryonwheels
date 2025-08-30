const express = require("express");
const {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Service
router.post("/", authMiddleware, hasPermission("Services", "Add"), createService);

// READ ALL Services
router.get("/", authMiddleware, hasPermission("Services", "View"), getAllServices);

// READ Single Service
router.get("/:id", authMiddleware, hasPermission("Services", "View"), getServiceById);

// UPDATE Service
router.put("/:id", authMiddleware, hasPermission("Services", "Edit"), updateService);

// DELETE Service
router.delete("/:id", authMiddleware, hasPermission("Services", "Delete"), deleteService);

module.exports = router;
