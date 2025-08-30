// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/customerauthMiddleware");
const { addToCart, getCart, updateCartItem, removeCartItem } = require("../controllers/cartController");

router.post("/add", protect, addToCart);
router.get("/", protect, getCart);
router.patch("/",      protect, updateCartItem);

// DELETE /cart/:itemId – remove one line
router.delete("/:itemId", protect, removeCartItem);

module.exports = router;
