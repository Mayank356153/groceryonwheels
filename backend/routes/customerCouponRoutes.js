// routes/customerCouponRoutes.js
const express = require("express");
const router = express.Router();
const customerCouponController = require("../controllers/customerCouponController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// CREATE
router.post(
  "/create",
  // authMiddleware,
  // hasPermission("CustomerCoupons", "Add"),
  customerCouponController.createCustomerCoupon
);

// READ ALL
router.get(
  "/",
  authMiddleware,
  hasPermission("CustomerCoupons", "View"),
  customerCouponController.getAllCustomerCoupons
);

// READ ONE
router.get(
  "/:id",
  authMiddleware,
  hasPermission("CustomerCoupons", "View"),
  customerCouponController.getCustomerCouponById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  hasPermission("CustomerCoupons", "Edit"),
  customerCouponController.updateCustomerCoupon
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("CustomerCoupons", "Delete"),
  customerCouponController.deleteCustomerCoupon
);

module.exports = router;
