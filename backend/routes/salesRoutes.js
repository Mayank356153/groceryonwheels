const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// Create a new Sale
router.post("/", authMiddleware, hasPermission("Sales", "Add"), salesController.createSale);

// Get all Sales
router.get("/", authMiddleware, hasPermission("Sales", "View"), salesController.getAllSales);

router.get(
    "/payments",
    authMiddleware,
    hasPermission("Sales", "View"),
    salesController.getSalesPayments
  );
router.delete(
  "/payments/:id",
  authMiddleware,
  hasPermission("Sales", "Delete"),   
  salesController.deleteSalePayment
);

router.get(
    "/recent",
    authMiddleware,
    (req, res, next) => {
      if (req.user.role.toLowerCase() === "admin") return next();
      return hasPermission("Sales", "View")(req, res, next);
    },
    salesController.getRecentSalesInvoices
  );

router.get("/filtered", authMiddleware, hasPermission("Sales", "View"), salesController.getFilteredSales);
// Get single Sale
router.get("/:id", authMiddleware, hasPermission("Sales", "View"), salesController.getSaleById);

// Update a Sale
router.put("/:id", authMiddleware, hasPermission("Sales", "Edit"), salesController.updateSale);

router.put('/:id/paymentType', salesController.updateSalePaymentType);

// Delete a Sale
router.delete("/:id", authMiddleware, hasPermission("Sales", "Delete"), salesController.deleteSale);

module.exports = router;

