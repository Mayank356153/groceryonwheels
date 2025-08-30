const express = require("express");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
const {
  createCustomerData,
  getAllCustomerData,
  getCustomerDataById,
  updateCustomerData,
  deleteCustomerData,
} = require("../controllers/customerDataController");

const router = express.Router();

// Create a new customer data record
router.post(
  "/create",
  authMiddleware,
  hasPermission("customers", "Add"),
  createCustomerData
);

// Get all customer data records
router.get(
  "/all",
  authMiddleware,
  hasPermission("customers", "View"),
  getAllCustomerData
);

// Get a single customer data record by ID
router.get(
  "/:id",
  authMiddleware,
  hasPermission("customers", "View"),
  getCustomerDataById
);

// Update a customer data record
router.put(
  "/:id",
  authMiddleware,
  hasPermission("customers", "Edit"),
  updateCustomerData
);

// Delete a customer data record
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("customers", "Delete"),
  deleteCustomerData
);

module.exports = router;
