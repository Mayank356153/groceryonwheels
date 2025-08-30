const WishlistItem = require("../models/WishlistItem");
const CartItem = require("../models/CartItem");

exports.addToWishlist = async (req, res) => {
  try {
    const customerId = req.user;

    /* ────────── 1. Bulk mode ────────── */
    if (Array.isArray(req.body.items)) {
      const itemIds = req.body.items.filter(Boolean);          // drop null/undefined
      if (!itemIds.length) {
        return res.status(400).json({ message: "Items array is empty" });
      }

      // Find what’s already there to avoid duplicates
      const existing = await WishlistItem.find({
        customer: customerId,
        item:     { $in: itemIds }
      }).distinct("item");                   // array of itemIds already present

      const newRows = itemIds
        .filter(id => !existing.includes(id))
        .map(id => ({ customer: customerId, item: id }));

      if (!newRows.length) {
        return res.status(200).json({ message: "All items already in wishlist" });
      }

      const created = await WishlistItem.insertMany(newRows);
      return res.status(201).json({
        message: `Added ${created.length} item(s) to wishlist`,
        wishlistItems: created
      });
    }

    /* ────────── 2. Single-item mode (legacy) ────────── */
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "Item ID is required" });

    const exists = await WishlistItem.findOne({ customer: customerId, item: itemId });
    if (exists) return res.status(400).json({ message: "Item already in wishlist" });

    const wishlistItem = await WishlistItem.create({ customer: customerId, item: itemId });
    res.status(201).json({ message: "Added to wishlist", wishlistItem });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moveWishlistToCart = async (req, res) => {
  try {
    const customerId = req.user;

    const wishlistItems = await WishlistItem.find({ customer: customerId });
    if (!wishlistItems.length) {
      return res.status(400).json({ message: "Wishlist is empty" });
    }

    for (const wish of wishlistItems) {
      // Upsert into cart (quantity +1 or create with 1)
      let cartRow = await CartItem.findOne({ customer: customerId, item: wish.item });
      if (cartRow) {
        cartRow.quantity += 1;
      } else {
        cartRow = new CartItem({ customer: customerId, item: wish.item, quantity: 1 });
      }
      await cartRow.save();
    }

    // Clear the wishlist once everything is moved
    await WishlistItem.deleteMany({ customer: customerId });

    // Return the fresh cart (optional but handy)
    const cartItems = await CartItem.find({ customer: customerId })
      .populate("item", "itemName salesPrice itemCode");

    const totalBill = cartItems.reduce((sum, row) =>
      sum + (row.item?.salesPrice || 0) * row.quantity, 0);

    res.status(200).json({ message: "Wishlist moved to cart", cartItems, totalBill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const customerId = req.user;
    // In your getWishlist controller:
const wishlist = await WishlistItem.find({ customer: customerId })
.populate("item", "itemName itemCode salesPrice itemImage");

    res.json({ wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};