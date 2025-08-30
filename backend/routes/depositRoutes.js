const express = require("express");
const {
  createDeposit,
  getAllDeposits,
  getDepositById,
  updateDeposit,
  deleteDeposit
} = require("../controllers/depositController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Deposit
router.post(
  "/",
  authMiddleware,
  hasPermission("Deposits", "Add"),
  createDeposit
);

// GET All Deposits
router.get(
  "/",
  authMiddleware,
  hasPermission("Deposits", "View"),
  getAllDeposits
);

// GET Single Deposit
router.get(
  "/:id",
  authMiddleware,
  hasPermission("Deposits", "View"),
  getDepositById
);

// UPDATE Deposit
router.put(
  "/:id",
  authMiddleware,
  hasPermission("Deposits", "Edit"),
  updateDeposit
);

// DELETE Deposit
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("Deposits", "Delete"),
  deleteDeposit
);

module.exports = router;
