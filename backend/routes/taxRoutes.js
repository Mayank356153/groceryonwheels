const express = require("express");
const {
  createTax,
  getAllTaxes,
  getTaxById,
  updateTax,
  deleteTax,
  createTaxGroup,
  getAllTaxGroups,
  getTaxGroupById,
  updateTaxGroup,
  deleteTaxGroup,
} = require("../controllers/taxController");

const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();


// ---------- TAX ROUTES ----------

// CREATE Tax
router.post("/taxes", authMiddleware, hasPermission("Taxes", "Add"), createTax);

// GET All Taxes
router.get("/taxes", authMiddleware, hasPermission("Taxes", "View"), getAllTaxes);

// GET Single Tax by ID
router.get("/taxes/:id", authMiddleware, hasPermission("Taxes", "View"), getTaxById);

// UPDATE Tax
router.put("/taxes/:id", authMiddleware, hasPermission("Taxes", "Edit"), updateTax);

// DELETE Tax
router.delete("/taxes/:id", authMiddleware, hasPermission("Taxes", "Delete"), deleteTax);

// ---------- TAX GROUP ROUTES ----------

// CREATE TaxGroup
router.post("/tax-groups", authMiddleware, hasPermission("TaxGroups", "Add"), createTaxGroup);

// GET All TaxGroups
router.get("/tax-groups", authMiddleware, hasPermission("TaxGroups", "View"), getAllTaxGroups);

// GET Single TaxGroup by ID
router.get("/tax-groups/:id", authMiddleware, hasPermission("TaxGroups", "View"), getTaxGroupById);

// UPDATE TaxGroup
router.put("/tax-groups/:id", authMiddleware, hasPermission("TaxGroups", "Edit"), updateTaxGroup);

// DELETE TaxGroup
router.delete("/tax-groups/:id", authMiddleware, hasPermission("TaxGroups", "Delete"), deleteTaxGroup);

module.exports = router;
