const express = require("express");
const {
  createCashTransaction,
  getAllCashTransactions,
  getFilteredCashTransactions,
  getCashTransactionById,
  updateCashTransaction,
  deleteCashTransaction,
} = require("../controllers/cashTransactionController");

const router = express.Router();

// CREATE a Cash Transaction
router.post("/", createCashTransaction);

// READ All Cash Transactions
router.get("/", getAllCashTransactions);

// READ Filtered Cash Transactions (by user, fromDate, toDate)
router.get("/filter", getFilteredCashTransactions);

// READ a Single Cash Transaction by ID
router.get("/:id", getCashTransactionById);

// UPDATE a Cash Transaction
router.put("/:id", updateCashTransaction);

// DELETE a Cash Transaction
router.delete("/:id", deleteCashTransaction);

module.exports = router;
