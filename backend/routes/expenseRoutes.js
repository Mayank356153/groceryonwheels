const express = require("express");
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require("../controllers/expenseController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Expense
router.post(
  "/",
  authMiddleware,
  hasPermission("Expenses", "Add"),
  createExpense
);

// GET All Expenses
router.get(
  "/",
  authMiddleware,
  hasPermission("Expenses", "View"),
  getAllExpenses
);

// GET Single Expense
router.get(
  "/:id",
  authMiddleware,
  hasPermission("Expenses", "View"),
  getExpenseById
);

// UPDATE Expense
router.put(
  "/:id",
  authMiddleware,
  hasPermission("Expenses", "Edit"),
  updateExpense
);

// DELETE Expense
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("Expenses", "Delete"),
  deleteExpense
);

module.exports = router;
