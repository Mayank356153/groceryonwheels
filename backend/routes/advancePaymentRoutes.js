const express = require("express");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
const router = express.Router();
const advancePaymentController = require("../controllers/advancePaymentController");


router.post(
    "/", 
    authMiddleware,
    hasPermission("AdvancePayment", "Add"), advancePaymentController.createAdvancePayment);
router.get(
    "/", 
    authMiddleware,
    hasPermission("AdvancePayment", "View"), advancePaymentController.getAllAdvancePayments);
router.put(
    "/:id", 
    authMiddleware,
    hasPermission("AdvancePayment", "Edit"), advancePaymentController.updateAdvancePayment);
router.delete(
    "/:id",
    authMiddleware,
    hasPermission("AdvancePayment", "Delete"), advancePaymentController.deleteAdvancePayment);

module.exports = router;