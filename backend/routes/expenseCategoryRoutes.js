const express = require("express");
const router = express.Router();
const expenseCategoryController = require("../controllers/expenseCategoryController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// CREATE Expense Category
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    // Allow admins to bypass permission check
    if (req.user.role.toLowerCase() === "admin") return next();
    // Otherwise, check for "Add" permission on ExpenseCategories
    return hasPermission("ExpenseCategories", "Add")(req, res, next);
  },
  expenseCategoryController.createExpenseCategory
);

// GET All Expense Categories
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("ExpenseCategories", "View")(req, res, next);
  },
  expenseCategoryController.getAllExpenseCategories
);

// GET Single Expense Category by ID
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("ExpenseCategories", "View")(req, res, next);
  },
  expenseCategoryController.getExpenseCategoryById
);

// UPDATE Expense Category
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("ExpenseCategories", "Edit")(req, res, next);
  },
  expenseCategoryController.updateExpenseCategory
);

// DELETE Expense Category
router.delete(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("ExpenseCategories", "Delete")(req, res, next);
  },
  expenseCategoryController.deleteExpenseCategory
);

module.exports = router;
