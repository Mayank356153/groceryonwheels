const express = require("express");
const {
  createMoneyTransfer,
  getAllTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer
} = require("../controllers/moneyTransferController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Money Transfer
router.post(
  "/",
  authMiddleware,
  hasPermission("MoneyTransfers", "Add"),
  createMoneyTransfer
);

// READ All Money Transfers
router.get(
  "/",
  authMiddleware,
  hasPermission("MoneyTransfers", "View"),
  getAllTransfers
);

// READ Single Money Transfer
router.get(
  "/:id",
  authMiddleware,
  hasPermission("MoneyTransfers", "View"),
  getTransferById
);

// UPDATE Money Transfer
router.put(
  "/:id",
  authMiddleware,
  hasPermission("MoneyTransfers", "Edit"),
  updateTransfer
);

// DELETE Money Transfer
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("MoneyTransfers", "Delete"),
  deleteTransfer
);

module.exports = router;
