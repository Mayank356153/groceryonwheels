const router = require("express").Router();
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");   // admin guards
const { protect }                 = require("../middleware/customerauthMiddleware"); // customer guard

const {
  getOrders,          // returns only req.user’s orders
  getAllOrders,
  getAnyOrderById,       // NEW: returns every order (no filter)
  createOrder,
  updateOrder,
  getOrderById,
  placeOrderFromSession,
  updateOrderStatus,
  deleteById,
  assignDeliveryAgent,
  giveRating
} = require("../controllers/orderController");

const { createCheckoutSession,verifyPayment } = require("../controllers/checkoutController");

/* ─── Admin endpoints first (more specific paths) ─── */
router.get("/admin",            authMiddleware, getAllOrders);
router.get("/admin/:id",        authMiddleware, isAdmin, getAnyOrderById);
router.put("/:id",              authMiddleware, isAdmin, updateOrder);   // status change

/* ─── Customer endpoints ─── */
router.get("/",                 protect, getOrders);              // history
router.post("/",                protect, createOrder);            // legacy single-step
router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/place-from-session",      protect, placeOrderFromSession);
router.get("/:id",              protect, getOrderById);           // detail
router.put("/verify-payment",authMiddleware,verifyPayment)
router.put("/update-status/:id",authMiddleware,updateOrderStatus)
router.delete("/:id",deleteById)
router.put("/assign-order/:id",assignDeliveryAgent)
router.put("/rating/:orderId",giveRating)

module.exports = router;
