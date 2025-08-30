const mongoose = require("mongoose");
const StockAdjustment = require("../models/stockAdjustmentModel");
const Warehouse = require("../models/warehouseModel"); 
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");
const { updateInventory } = require("../helpers/inventory"); 

exports.createStockAdjustment = async (req, res) => {
  try {
    const { warehouse, adjustmentDate, referenceNo, items, note, createdBy } = req.body;
    if (!warehouse || !adjustmentDate || !items?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validate and sanitize items
    const sanitizedItems = [];
    for (const line of items) {
      const itemId = (line.item && line.item._id) || line.item;
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, message: `Invalid item ID: ${itemId}` });
      }
      const itemDoc = await Item.findById(itemId);
      if (!itemDoc) {
        return res.status(404).json({ success: false, message: `Item not found: ${itemId}` });
      }
      sanitizedItems.push({
        item: new mongoose.Types.ObjectId(itemId),
        quantity: Number(line.quantity) || 0,
      });
    }

    const totalQuantity = sanitizedItems.reduce((sum, i) => sum + i.quantity, 0);

    const newAdjustment = new StockAdjustment({
      warehouse,
      adjustmentDate,
      referenceNo,
      items: sanitizedItems,
      totalQuantity,
      note,
      createdBy,
    });
    const saved = await newAdjustment.save();

    for (const line of saved.items) {
      await updateInventory(saved.warehouse, line.item, Number(line.quantity));
    }

    return res.status(201).json({
      success: true,
      message: "Stock adjustment created successfully",
      data: saved,
    });
  } catch (error) {
    console.error("createStockAdjustment failed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllStockAdjustments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.warehouse) {
      filter.warehouse = req.query.warehouse;
    }

    const adjustments = await StockAdjustment.find(filter)
      .populate("warehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");
    return res.status(200).json({ success: true, data: adjustments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStockAdjustmentById = async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findById(req.params.id)
      .populate("warehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");
    if (!adjustment) {
      return res.status(404).json({ success: false, message: "Stock adjustment not found" });
    }
    return res.status(200).json({ success: true, data: adjustment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStockAdjustment = async (req, res) => {
  try {
    const adjustmentId = req.params.id;
    const { warehouse: newWarehouse, items: newItems, ...rest } = req.body;

    const old = await StockAdjustment.findById(adjustmentId).lean();
    if (!old) {
      return res.status(404).json({ success: false, message: "Stock adjustment not found" });
    }

    for (const line of old.items) {
      await updateInventory(old.warehouse, line.item, -Number(line.quantity));
    }

    const sanitizedItems = [];
    for (const line of newItems) {
      const itemId = (line.item && line.item._id) || line.item;
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, message: `Invalid item ID: ${itemId}` });
      }
      const itemDoc = await Item.findById(itemId);
      if (!itemDoc) {
        return res.status(404).json({ success: false, message: `Item not found: ${itemId}` });
      }
      sanitizedItems.push({
        item: new mongoose.Types.ObjectId(itemId),
        quantity: Number(line.quantity) || 0,
      });
    }

    const totalQuantity = sanitizedItems.reduce((sum, i) => sum + i.quantity, 0);

    const updated = await StockAdjustment.findByIdAndUpdate(
      adjustmentId,
      {
        ...rest,
        warehouse: newWarehouse,
        items: sanitizedItems,
        totalQuantity,
      },
      { new: true }
    )
      .populate("warehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");

    for (const line of updated.items) {
      await updateInventory(updated.warehouse, line.item, Number(line.quantity));
    }

    return res.status(200).json({
      success: true,
      message: "Stock adjustment updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating stock adjustment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStockAdjustment = async (req, res) => {
  try {
    const deletedAdjustment = await StockAdjustment.findByIdAndDelete(req.params.id);
    if (!deletedAdjustment) {
      return res.status(404).json({ success: false, message: "Stock adjustment not found" });
    }
    return res.status(200).json({ success: true, message: "Stock adjustment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};