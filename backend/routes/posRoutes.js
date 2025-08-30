const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderPaymentType
} = require("../controllers/posController");

const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
const { getAllInvoices,getAllInvoicesClub ,getInvoiceCode,getLatestInvoices,getPeriodInvoices} = require("../controllers/invoiceController");
// CREATE a new POS order
router.post(
  "/",
  authMiddleware,
  hasPermission("POSOrders", "Add"),
  createOrder
);

router.get(
  "/invoices",                                  // or "/combined"
  authMiddleware,
  hasPermission("POSOrders", "View"),           // pick the permission you want
  getAllInvoices
);

router.get(
  "/club",
  authMiddleware,
  hasPermission("POSOrders", "View"),
  getAllInvoicesClub
);


router.get(
  "/invoice-code",
  authMiddleware,
  getInvoiceCode
);

router.get(
  "/latest-invoices",
  authMiddleware,
  hasPermission("POSOrders", "View"),
  getLatestInvoices
);


router.get(
  "/period-invoices",
  authMiddleware,
  hasPermission("POSOrders", "View"),
  getPeriodInvoices
);


// GET all POS orders
router.get(
  "/",
  authMiddleware,
  hasPermission("POSOrders", "View"),
  getAllOrders
);

// GET a single POS order by ID
router.get(
  "/:id",
  authMiddleware,
  hasPermission("POSOrders", "View"),
  getOrderById
);

// UPDATE a POS order
router.put(
  "/:id",
  authMiddleware,
  hasPermission("POSOrders", "Edit"),
  updateOrder
);

router.put("/:id/paymentType",
  authMiddleware,
  updateOrderPaymentType
);

// DELETE a POS order
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("POSOrders", "Delete"),
  deleteOrder
);

module.exports = router;
