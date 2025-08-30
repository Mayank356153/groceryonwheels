const CartItem = require("../models/CartItem");
const Item = require("../models/itemModel"); // Assuming you have an Item model

exports.addToCart = async (req, res) => {
    try {
      const customerId = req.user;
      // Check if the request body has an "items" array.
      if (Array.isArray(req.body.items)) {
        let addedItems = [];
        
        for (let cartEntry of req.body.items) {
          const { itemId, quantity } = cartEntry;
          if (!itemId) {
            return res.status(400).json({ message: "Item ID is required for each item" });
          }
          if (quantity && quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
          }
          
          let cartItem = await CartItem.findOne({ customer: customerId, item: itemId });
          if (cartItem) {
            cartItem.quantity += quantity || 1;
          } else {
            cartItem = new CartItem({ customer: customerId, item: itemId, quantity: quantity || 1 });
          }
          await cartItem.save();
          addedItems.push(cartItem);
        }
        return res.status(201).json({ message: "Items added to cart", cartItems: addedItems });
      } else {
        // Fallback: Single item approach
        const { itemId, quantity } = req.body;
        if (!itemId) return res.status(400).json({ message: "Item ID is required" });
        if (quantity && quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });
    
        let cartItem = await CartItem.findOne({ customer: customerId, item: itemId });
        if (cartItem) {
          cartItem.quantity += quantity || 1;
        } else {
          cartItem = new CartItem({ customer: customerId, item: itemId, quantity: quantity || 1 });
        }
        await cartItem.save();
        return res.status(201).json({ message: "Item added to cart", cartItem });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getCart = async (req, res) => {
  try {
    const customerId = req.user;
    // Populate item details from the Item collection
    const cartItems = await CartItem.find({ customer: customerId })
  .populate("item", "itemName salesPrice itemCode itemImages");


    // Calculate total bill, assuming each item has a salesPrice field
    const totalBill = cartItems.reduce((total, item) => {
      const price = item.item?.salesPrice || 0;
      return total + price * item.quantity;
    }, 0);

    res.json({ cartItems, totalBill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const customerId = req.user;
    const { itemId, quantity } = req.body;

    if (!itemId)  return res.status(400).json({ message:"Item ID required" });
    if (quantity < 1) {
      // treat 0 or negative as “remove”
      await CartItem.deleteOne({ customer: customerId, item: itemId });
      return res.json({ message:"Item removed from cart" });
    }

    const row = await CartItem.findOneAndUpdate(
      { customer: customerId, item: itemId },
      { $set:{ quantity } },
      { new:true }
    );

    if (!row) return res.status(404).json({ message:"Item not in cart" });
    res.json({ message:"Quantity updated", cartItem: row });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const customerId = req.user;
    const { itemId } = req.params;

    const result = await CartItem.deleteOne({ customer: customerId, item: itemId });
    if (result.deletedCount === 0)
      return res.status(404).json({ message:"Item not in cart" });

    res.json({ message:"Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
