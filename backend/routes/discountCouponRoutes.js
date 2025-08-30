const express = require("express");
const router = express.Router();
const discountCouponController = require("../controllers/discountCouponController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

// CREATE
router.post(
  "/create",
  authMiddleware,
  hasPermission("Coupons", "Add"),
  discountCouponController.createDiscountCoupon
);

// READ ALL
router.get(
  "/",
  authMiddleware,
  hasPermission("Coupons", "View"),
  discountCouponController.getAllDiscountCoupons
);

// READ ONE
router.get(
  "/:id",
  authMiddleware,
  hasPermission("Coupons", "View"),
  discountCouponController.getDiscountCouponById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  hasPermission("Coupons", "Edit"),
  discountCouponController.updateDiscountCoupon
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("Coupons", "Delete"),
  discountCouponController.deleteDiscountCoupon
);

module.exports = router;