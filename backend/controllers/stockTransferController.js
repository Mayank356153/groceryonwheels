
const mongoose = require("mongoose");
const StockTransfer = require("../models/stockTransferModel");
const Warehouse = require("../models/warehouseModel");
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");

// Helper function to update the inventory ledger for a specific (warehouse, item) pair.
async function updateInventory(warehouseId, itemId, quantityDelta) {
  const updatedRecord = await Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item: new mongoose.Types.ObjectId(itemId)
    },
    {
      $inc: { quantity: quantityDelta },
      $set: { lastUpdated: new Date() }
    },
    { new: true, upsert: true } // upsert creates the record if it doesn't exist.
  );
  return updatedRecord;
}

// CREATE Stock Transfer
exports.createStockTransfer = async (req, res) => {
  try {
    const { transferDate, fromWarehouse, toWarehouse, items, note, details, createdBy } = req.body;

    if (!transferDate || !fromWarehouse || !toWarehouse || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields or items are empty" });
    }

    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({ success: false, message: "Cannot transfer to the same warehouse" });
    }

    // Create a new stock transfer document.
    const newTransfer = new StockTransfer({
      transferDate,
      fromWarehouse,
      toWarehouse,
      items,
      note,
      details,
      createdBy
    });

    await newTransfer.save();

    // Update the inventory ledger for each transferred item.
    for (const transferItem of items) {
      // Decrease stock from the sending warehouse.
      await updateInventory(fromWarehouse, transferItem.item, -transferItem.quantity);
      // Increase stock in the receiving warehouse.
      await updateInventory(toWarehouse, transferItem.item, transferItem.quantity);
    }

    return res.status(201).json({
      success: true,
      message: "Stock transfer created successfully",
      data: newTransfer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Stock Transfers
exports.getAllStockTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.fromWarehouse) filter.fromWarehouse = req.query.fromWarehouse;
    if (req.query.toWarehouse) filter.toWarehouse = req.query.toWarehouse;

    const transfers = await StockTransfer.find(filter)
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");
    return res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Stock Transfer
exports.getStockTransferById = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
  /* warehouses */
  .populate('fromWarehouse', 'warehouseName')
  .populate('toWarehouse',   'warehouseName')

  /* line items (one nested populate call) */
  .populate({
    path: 'items',
    populate: [
      { path: 'item',    select: 'itemName itemCode'       },   // parent SKU
      { path: 'variant', select: 'variantName variantCode' }    // variant (if any)
    ]
  })

  /* createdBy – COMMENT THIS OUT if your model has no createdBy field */
  .populate({
    path: 'createdBy',
    select: 'name FirstName LastName'
  });


    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found"
      });
    }

    return res.status(200).json({ success: true, data: transfer });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE Stock Transfer
exports.updateStockTransfer = async (req, res) => {
  try {
    const transferId = req.params.id;
    const { fromWarehouse: newFrom, toWarehouse: newTo, items: newItems } = req.body;
    console.log("Received req.body:", req.body); // Add this debug log

    // 1️⃣ Fetch the old transfer with item details
    const oldTransfer = await StockTransfer.findById(transferId)
      .populate('items.item', 'itemName')
      .lean();
    if (!oldTransfer) {
      return res.status(404).json({ success: false, message: "Stock transfer not found" });
    }

    // 2️⃣ Check if warehouses have changed (disallow for simplicity)
    if (newFrom !== oldTransfer.fromWarehouse.toString() || newTo !== oldTransfer.toWarehouse.toString()) {
      return res.status(400).json({ success: false, message: "Cannot change warehouses during edit" });
    }

    // 3️⃣ Use delta for quantity changes
    const itemMap = new Map(newItems.map(it => [it.item.toString(), it.quantity]));
    for (const oldItem of oldTransfer.items) {
      const itemIdStr = oldItem.item._id.toString(); // Change here: use oldItem.item._id.toString()
      const oldQty = oldItem.quantity;
      const newQty = itemMap.get(itemIdStr) || 0; // if removed, newQty = 0
      const delta = newQty - oldQty;
      console.log(`Item: ${oldItem.item.itemName}, oldQty: ${oldQty}, newQty: ${newQty}, delta: ${delta}`); // Add here

      if (delta > 0) {
        // Increase: check fromWarehouse stock
        const currentFromStock = await Inventory.findOne({
          warehouse: newFrom,
          item: oldItem.item._id // Change here: use oldItem.item._id
        }).select('quantity');
        const availableFrom = currentFromStock ? currentFromStock.quantity : 0;
        if (delta > availableFrom) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock in sending warehouse for item '${oldItem.item.itemName}'. Available: ${availableFrom}, Required extra: ${delta}`
          });
        }
      } else if (delta < 0) {
        // Decrease: check toWarehouse stock for return
        const returnQty = -delta; // Amount to return to fromWarehouse
        const currentToStock = await Inventory.findOne({
          warehouse: newTo,
          item: oldItem.item._id // Change here: use oldItem.item._id
        }).select('quantity');
        const availableTo = currentToStock ? currentToStock.quantity : 0;
        if (returnQty > availableTo) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce transfer for item '${oldItem.item.itemName}'. Receiving warehouse has only ${availableTo} units, but ${returnQty} are needed to return.`
          });
        }
      }
      // Apply delta (no change if delta = 0)
      if (delta !== 0) {
        await updateInventory(newFrom, oldItem.item._id, -delta); // Change here: use oldItem.item._id
        await updateInventory(newTo, oldItem.item._id, +delta); // Change here: use oldItem.item._id
      }
    }

    // 4️⃣ Update the transfer record
    const updated = await StockTransfer.findByIdAndUpdate(
      transferId,
      { ...req.body },
      { new: true }
    )
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");

    return res.status(200).json({
      success: true,
      message: "Stock transfer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating stock transfer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// DELETE Stock Transfer
exports.deleteStockTransfer = async (req, res) => {
  try {
    // NOTE: Reversing ledger updates for deletion is not implemented here.
    // A complete solution would require adding ledger update logic to reverse the transfer.
    const deletedTransfer = await StockTransfer.findByIdAndDelete(req.params.id);
    if (!deletedTransfer) {
      return res.status(404).json({ success: false, message: "Stock transfer not found" });
    }
    return res.status(200).json({ success: true, message: "Stock transfer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInventoryByWarehouse = async (req, res) => {
  const records = await Inventory.find({ warehouse: req.query.warehouse })
    .populate("item", "itemName itemCode barcode");
  res.json(records);
};

exports.bulkTransfer = async (req, res) => {
  const { fromWarehouse, toWarehouse, leaveBehind = 0 } = req.body;
  if (!fromWarehouse || !toWarehouse || fromWarehouse === toWarehouse) {
    return res.status(400).json({ success:false, message:"Bad warehouses" });
  }

  // 1️⃣ grab live stock
  const stock = await Inventory.find({
    warehouse: fromWarehouse,
    quantity : { $gt: leaveBehind }
  }).lean();
  const opener = await Item.find({
   warehouse    : fromWarehouse,
   openingStock : { $gt: leaveBehind },
   _id          : { $nin: stock.map(s => s.item) }   // exclude ones we already have
 }).select("_id openingStock").lean();

  if (!stock.length) {
    return res.status(400).json({ success:false, message:"Nothing to move" });
  }

  // 2️⃣ build items list
  const items = [
    ...stock.map(r => ({
      item     : r.item,
      quantity : r.quantity - leaveBehind
    })),
   ...opener.map(r => ({
     item     : r._id,
     quantity : r.openingStock - leaveBehind
   }))
  ];

  // 3️⃣ make ONE StockTransfer doc
  const transfer = await StockTransfer.create({
    transferDate : new Date(),
    fromWarehouse,
    toWarehouse,
    items,
    note   : `Bulk transfer ${new Date().toISOString()}`,
    details: `Auto-moved ${items.length} SKUs`,
    createdBy: req.user.id
  });

  // 4️⃣ inventory diff – bulkWrite twice
  const dec = items.map(r => ({
    updateOne: {
      filter: { warehouse: fromWarehouse, item: r.item },
      update: { $inc: { quantity: -r.quantity } }
    }
  }));
  const inc = items.map(r => ({
    updateOne: {
      filter: { warehouse: toWarehouse, item: r.item },
      update: { $inc: { quantity:  r.quantity }, $setOnInsert:{ lastUpdated:new Date() } },
      upsert: true
    }
  }));
  await Promise.all([
    Inventory.bulkWrite(dec),
    Inventory.bulkWrite(inc)
  ]);

  res.status(201).json({ success:true, message:"Bulk transfer complete", data:transfer });
};