const express = require("express");
const {
  createPaymentType,
  getAllPaymentTypes,
  getPaymentTypeById,
  updatePaymentType,
  deletePaymentType,
} = require("../controllers/paymentTypeController");

const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Payment Type
router.post("/payment-types", authMiddleware, hasPermission("PaymentTypes", "Add"), createPaymentType);

// GET All Payment Types
router.get("/payment-types", authMiddleware, hasPermission("PaymentTypes", "View"), getAllPaymentTypes);

// GET Single Payment Type by ID
router.get("/payment-types/:id", authMiddleware, hasPermission("PaymentTypes", "View"), getPaymentTypeById);

// UPDATE Payment Type
router.put("/payment-types/:id", authMiddleware, hasPermission("PaymentTypes", "Edit"), updatePaymentType);

// DELETE Payment Type
router.delete("/payment-types/:id", authMiddleware, hasPermission("PaymentTypes", "Delete"), deletePaymentType);

module.exports = router;
