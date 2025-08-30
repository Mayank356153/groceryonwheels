const Subscription = require("../models/subscriptionModel");
const Store = require("../models/storeModel"); // or wherever your Store model is

// CREATE a new Subscription
exports.createSubscription = async (req, res) => {
  try {
    const {
      store,
      packageName,
      category,
      productCount,
      description,
      total,
      paymentType,
      status,
      startDate,
      endDate
    } = req.body;

    if (!store) {
      return res.status(400).json({ 
        success: false, 
        message: "Store reference is required" 
      });
    }

    // Optionally check if store exists:
    const existingStore = await Store.findById(store);
    if (!existingStore) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid store ID" 
      });
    }

    const newSub = new Subscription({
      store,
      packageName,
      category,
      productCount,
      description,
      total,
      paymentType,
      status: status || "active",
      startDate,
      endDate
    });

    await newSub.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: newSub,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create subscription", 
      error: error.message 
    });
  }
};

// GET ALL Subscriptions (optionally filter by store)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { storeId } = req.query; // e.g. /api/subscriptions?storeId=xxxx
    let filter = {};

    if (storeId) {
      filter.store = storeId;
    }

    // Populate 'store' if you want store info in the subscription data
    const subscriptions = await Subscription.find(filter)
      .populate("store", "StoreName Mobile Email") 
      .populate("paymentType", "paymentTypeName");

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch subscriptions", 
      error: error.message 
    });
  }
};

// GET single Subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("store", "StoreName Mobile Email")
      .populate("paymentType", "paymentTypeName");
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get subscription", 
      error: error.message 
    });
  }
};

// UPDATE Subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSub = await Subscription.findByIdAndUpdate(
      id,
      req.body,
      { new: true } // returns the updated doc
    )
      .populate("store", "StoreName Mobile Email")
      .populate("paymentType", "paymentTypeName");

    if (!updatedSub) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSub,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update subscription", 
      error: error.message 
    });
  }
};

// DELETE Subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const deletedSub = await Subscription.findByIdAndDelete(req.params.id);
    if (!deletedSub) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: deletedSub,
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete subscription", 
      error: error.message 
    });
  }
};
