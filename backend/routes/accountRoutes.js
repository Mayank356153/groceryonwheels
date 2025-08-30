const express = require("express");
const {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require("../controllers/accountController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Account (requires "Add" permission)
router.post("/", authMiddleware, hasPermission("Accounts", "Add"), createAccount);

// READ all Accounts (requires "View" permission)
router.get("/", authMiddleware, hasPermission("Accounts", "View"), getAllAccounts);

// READ single Account by ID (requires "View" permission)
router.get("/:id", authMiddleware, hasPermission("Accounts", "View"), getAccountById);

// UPDATE Account (requires "Edit" permission)
router.put("/:id", authMiddleware, hasPermission("Accounts", "Edit"), updateAccount);

// DELETE Account (requires "Delete" permission)
router.delete("/:id", authMiddleware, hasPermission("Accounts", "Delete"), deleteAccount);

module.exports = router;
