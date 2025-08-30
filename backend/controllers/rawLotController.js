const RawLot = require("../models/rawLotModel");
const Item   = require("../models/itemModel");   
const { updateInventory } = require("../helpers/inventory");
const mongoose = require("mongoose");
const Inventory = require('../models/inventoryModel'); 
const Purchase = require("../models/purchaseModel");

/* POST  /api/raw-lots  --------------------------------------------- */
exports.createRawLot = async (req, res) => {
  try {
    const lot = await RawLot.create(req.body);
    return res.status(201).json({ success: true, data: lot });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/* GET   /api/raw-lots?warehouse=&packed=0|1|all&withPacks=1 --------- */
/* GET   /api/raw-lots?warehouse=&packed=0|1|all&withPacks=1 --------- */
exports.getRawLots = async (req, res) => {
  try {
    const { warehouse, packed, withPacks } = req.query;
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (packed === "0") filter.isPacked = false;
    if (packed === "1") filter.isPacked = true;

    const lots = await RawLot.find(filter)
      .populate("item", "itemName itemCode")
      .populate("warehouse", "warehouseName")
      .sort({ createdAt: -1 })
      .lean(); // plain JS objects

    if (withPacks) {
      lots.forEach((lot) => {
        if (!lot.packSize) return;

        lot.packsMade = lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize);
        const totalPacks = lot.isPacked ? lot.totalPacksMade : Math.floor(lot.bulkQty / lot.packSize);
        lot.packsLeft = Math.max(0, totalPacks - lot.packsMade);
      });
    }

    return res.json({ success: true, data: lots });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


exports.packLot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { packSize, packs, isFullyPacked, packCost, salesPrice } = req.body;

    // Validate inputs
    if (!packs || packs <= 0 || !Number.isInteger(packs))
      return res.status(400).json({ success: false, message: 'packs > 0 and integer required' });
    if (!packCost || packCost <= 0)
      return res.status(400).json({ success: false, message: 'packCost > 0 required' });

    // Log database connection
    console.log('Database URI:', mongoose.connection.client.s.url);

    // Fetch RawLot with session
    const lot = await RawLot.findById(req.params.id).populate('item').session(session);
    if (!lot)
      return res.status(404).json({ success: false, message: 'Lot not found' });

    // First call: set pack size and prices
    if (lot.packSize == null) {
      if (!packSize || packSize <= 0 || !Number.isInteger(packSize))
        return res.status(400).json({ success: false, message: 'packSize > 0 and integer required' });
      lot.packSize = packSize;
      lot.packCost = packCost;
      lot.salesPrice = salesPrice || lot.item.salesPrice || 0;
    }

    // Ensure consistent pack size
    if (packSize && Number(packSize) !== Number(lot.packSize))
      return res.status(400).json({
        success: false,
        message: `Pack size already fixed at ${lot.packSize}`,
      });

    // Calculate packs
    const totalPacks = Math.floor(lot.bulkQty / lot.packSize);
    const packsMade = lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize);
    const packsLeft = totalPacks - packsMade;
    console.log(`Calculated: totalPacks=${totalPacks}, packsMade=${packsMade}, packsLeft=${packsLeft}`);

    // Validate packs
    if (packs > packsLeft && !isFullyPacked) {
      console.log(`Validation failed: packs=${packs}, packsLeft=${packsLeft}`);
      return res.status(400).json({
        success: false,
        message: `Only ${packsLeft} packs left to make, or set isFullyPacked to true`,
      });
    }

    // Update packed quantity and total packs made
    const newPackedQty = lot.packedQty + packs * lot.packSize;
    lot.totalPacksMade = (lot.totalPacksMade || 0) + packs;

    // Handle isFullyPacked
    if (isFullyPacked) {
      lot.packedQty = lot.bulkQty;
      lot.isPacked = true;
      lot.totalPacksMade = totalPacks;
    } else if (newPackedQty > lot.bulkQty) {
      return res.status(400).json({
        success: false,
        message: `Cannot pack more than ${lot.bulkQty} ${lot.bulkUnit}`,
      });
    } else {
      lot.packedQty = newPackedQty;
      lot.isPacked = lot.packedQty >= lot.bulkQty;
    }

    // Update Purchase document
    const purchase = await Purchase.findById(lot.purchaseId).session(session);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const purchaseItem = purchase.items.find(item => item.item.toString() === lot.item._id.toString());
    if (!purchaseItem) {
      return res.status(404).json({ success: false, message: 'Purchase item not found' });
    }

    purchaseItem.quantity += packs; // Increment quantity by packs
    await purchase.save({ session });

    // Update Item prices
    await Item.findByIdAndUpdate(
      lot.item._id,
      {
        $set: {
          purchasePrice: lot.packCost,
          salesPrice: lot.salesPrice,
          isRaw: false,
        },
      },
      { new: true, select: 'purchasePrice salesPrice isRaw', session }
    );

    await lot.save({ session });

    await session.commitTransaction();

    console.log(`Updated Purchase: ${JSON.stringify(purchase)}`);
    return res.json({ success: true, data: lot });
  } catch (err) {
    await session.abortTransaction();
    console.error('packLot error:', err);
    return res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
exports.getPackStocks = async (req, res) => {
  try {
    const { warehouse } = req.query;
    const filter = { packedQty: { $gt: 0 } };
    if (warehouse) filter.warehouse = warehouse;

    const lots = await RawLot.find(filter)
      .populate("item", "itemName itemCode salesPrice")
      .lean();

    const payload = lots.map((lot) => {
      const packsMade = lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize);
      return {
        lotId: lot._id,
        parentId: lot.item._id,
        itemName: lot.item.itemName,
        itemCode: lot.item.itemCode,
        packSize: lot.packSize,
        packsLeft: packsMade, // Use totalPacksMade as stock
        unitCost: lot.packCost || (lot.bulkCost / lot.bulkQty), // Use packCost
        salesPrice: lot.salesPrice || lot.item.salesPrice || 0, // Use RawLot salesPrice
        warehouse: lot.warehouse,
      };
    });

    return res.json({ success: true, data: payload });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPackStock = async (req, res) => {
  try {
    const lot = await RawLot.findById(req.params.lotId)
      .populate("item", "itemName itemCode salesPrice")
      .lean();
    if (!lot || !lot.packSize) {
      return res.status(404).json({ success: false, message: "Packed lot not found" });
    }

    const packsMade = lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize);

    return res.json({
      success: true,
      data: {
        lotId: lot._id,
        parentId: lot.item._id,
        itemName: lot.item.itemName,
        itemCode: lot.item.itemCode,
        packSize: lot.packSize,
        packsLeft: packsMade, // Use totalPacksMade as stock
        unitCost: lot.packCost || (lot.bulkCost / lot.bulkQty),
        salesPrice: lot.salesPrice || lot.item.salesPrice || 0,
        warehouse: lot.warehouse,
      },
    });
  } catch (err) {
    console.error("Get pack stock error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deductPackStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { packs } = req.body;

    if (!packs || packs <= 0 || !Number.isInteger(packs)) {
      return res.status(400).json({ message: "Invalid packs value, must be a positive integer" });
    }

    const rawLot = await RawLot.findById(id);
    if (!rawLot || !rawLot.packSize) {
      return res.status(404).json({ message: "Packed lot not found" });
    }

    const packsMade = rawLot.totalPacksMade || Math.floor(rawLot.packedQty / rawLot.packSize);
    if (packs > packsMade) {
      return res.status(400).json({ message: `Not enough stock: ${packsMade} packs available` });
    }

    // Deduct from totalPacksMade and inventory
    rawLot.totalPacksMade = packsMade - packs;
    rawLot.packedQty = Number((rawLot.packedQty - packs * rawLot.packSize).toFixed(4));
    if (rawLot.packedQty < rawLot.bulkQty) rawLot.isPacked = false;

    // Deduct from item inventory
    await updateInventory(rawLot.warehouse, rawLot.item, -packs);

    await rawLot.save();

    return res.status(200).json({
      message: "Stock deducted successfully",
      data: {
        lotId: rawLot._id,
        packedQty: rawLot.packedQty,
        totalPacksMade: rawLot.totalPacksMade,
        packsLeft: rawLot.totalPacksMade,
      },
    });
  } catch (err) {
    console.error("deductPackStock error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
exports.editPackLot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { packs, packSize, packCost, salesPrice } = req.body;
    const lotId = req.params.id;

    // Validate inputs
    if (packs !== undefined && (!Number.isInteger(packs) || packs < 0)) {
      return res.status(400).json({ success: false, message: 'packs must be a non-negative integer' });
    }
    if (packSize !== undefined && (!Number.isInteger(packSize) || packSize <= 0)) {
      return res.status(400).json({ success: false, message: 'packSize must be a positive integer' });
    }
    if (packCost !== undefined && packCost < 0) {
      return res.status(400).json({ success: false, message: 'packCost cannot be negative' });
    }
    if (salesPrice !== undefined && salesPrice < 0) {
      return res.status(400).json({ success: false, message: 'salesPrice cannot be negative' });
    }

    // Log database connection
    console.log('Database URI:', mongoose.connection.client.s.url);

    // Fetch RawLot with session
    const lot = await RawLot.findById(lotId).populate('item').session(session);
    if (!lot || !lot.packSize) {
      return res.status(404).json({ success: false, message: 'Packed lot not found' });
    }

    // Calculate current state
    const currentPacksMade = lot.totalPacksMade || Math.floor(lot.packedQty / lot.packSize);
    const originalPackSize = lot.packSize;
    const totalPacks = Math.floor(lot.bulkQty / (packSize || originalPackSize));
    const currentPacksLeft = totalPacks - currentPacksMade;

    // Handle packSize change
    if (packSize !== undefined && packSize !== originalPackSize) {
      lot.packSize = packSize;
      const newPackedQty = currentPacksMade * packSize;
      if (newPackedQty > lot.bulkQty) {
        return res.status(400).json({
          success: false,
          message: `New packSize ${packSize} exceeds bulkQty ${lot.bulkQty}`,
        });
      }
      lot.packedQty = newPackedQty;
      lot.totalPacksMade = currentPacksMade; // Recalculate based on new packSize
    }

    // Handle packs change
    let packsDelta = 0;
    if (packs !== undefined) {
      if (packs > totalPacks && !lot.isPacked) {
        return res.status(400).json({
          success: false,
          message: `Cannot set packs to ${packs}, only ${totalPacks} packs possible`,
        });
      }
      packsDelta = packs - currentPacksMade;
      const newTotalQty = (currentPacksMade + packsDelta) * (packSize || originalPackSize);
      if (newTotalQty > lot.bulkQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot pack more than ${lot.bulkQty} ${lot.bulkUnit}`,
        });
      }
      lot.totalPacksMade = packs;
      lot.packedQty = packs * (packSize || originalPackSize);
      lot.isPacked = lot.packedQty >= lot.bulkQty;
    }

    // Update costs and prices
    if (packCost !== undefined) lot.packCost = packCost;
    if (salesPrice !== undefined) lot.salesPrice = salesPrice;

    // Update Purchase document
    const purchase = await Purchase.findById(lot.purchaseId).session(session);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    const purchaseItem = purchase.items.find(item => item.item.toString() === lot.item._id.toString());
    if (!purchaseItem) {
      return res.status(404).json({ success: false, message: 'Purchase item not found' });
    }
    purchaseItem.quantity += packsDelta; // Adjust quantity based on packs change
    if (purchaseItem.quantity < 0) {
      return res.status(400).json({ success: false, message: 'Purchase quantity cannot be negative' });
    }
    await purchase.save({ session });

    // Update Inventory
    if (packsDelta !== 0) {
      await updateInventory(lot.warehouse, lot.item._id, packsDelta, { session });
    }

    // Update Item prices
    await Item.findByIdAndUpdate(
      lot.item._id,
      {
        $set: {
          purchasePrice: lot.packCost,
          salesPrice: lot.salesPrice,
          isRaw: false,
        },
      },
      { new: true, select: 'purchasePrice salesPrice isRaw', session }
    );

    await lot.save({ session });

    await session.commitTransaction();

    console.log(`Updated RawLot: ${JSON.stringify(lot)}`);
    console.log(`Updated Purchase: ${JSON.stringify(purchase)}`);
    return res.json({ success: true, data: lot });
  } catch (err) {
    await session.abortTransaction();
    console.error('editPackLot error:', err);
    return res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
