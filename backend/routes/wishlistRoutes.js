const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/customerauthMiddleware");
const { addToWishlist, getWishlist, moveWishlistToCart } = require("../controllers/wishlistController");

router.post("/add", protect, addToWishlist);
router.get("/", protect, getWishlist);
router.post("/to-cart",  protect, moveWishlistToCart); 

module.exports = router;