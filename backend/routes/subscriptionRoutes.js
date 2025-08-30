const express = require("express");
const {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} = require("../controllers/subscriptionController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// ---------- SUBSCRIPTION ROUTES ----------

// CREATE a new Subscription
router.post(
  "/subscriptions",
  authMiddleware,
  hasPermission("Subscriptions", "Add"),
  createSubscription
);

// GET All Subscriptions (optionally you can add filtering, e.g., by store with a query param)
router.get(
  "/subscriptions",
  authMiddleware,
  hasPermission("Subscriptions", "View"),
  getAllSubscriptions
);

// GET a Single Subscription by ID
router.get(
  "/subscriptions/:id",
  authMiddleware,
  hasPermission("Subscriptions", "View"),
  getSubscriptionById
);

// UPDATE a Subscription
router.put(
  "/subscriptions/:id",
  authMiddleware,
  hasPermission("Subscriptions", "Edit"),
  updateSubscription
);

// DELETE a Subscription
router.delete(
  "/subscriptions/:id",
  authMiddleware,
  hasPermission("Subscriptions", "Delete"),
  deleteSubscription
);

module.exports = router;
