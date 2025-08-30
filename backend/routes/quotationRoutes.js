const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// CREATE
router.post(
  "/",
  authMiddleware,
  hasPermission("Quotations", "Add"),
  quotationController.createQuotation
);

// READ ALL
router.get(
  "/",
  authMiddleware,
  hasPermission("Quotations", "View"),
  quotationController.getAllQuotations
);

// READ ONE
router.get(
  "/:id",
  authMiddleware,
  hasPermission("Quotations", "View"),
  quotationController.getQuotationById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  hasPermission("Quotations", "Edit"),
  quotationController.updateQuotation
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("Quotations", "Delete"),
  quotationController.deleteQuotation
);

module.exports = router;
