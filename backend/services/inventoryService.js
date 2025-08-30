// services/inventoryService.js

const mongoose        = require('mongoose');
const Inventory       = require('../models/inventoryModel');
const StockAdjustment = require('../models/stockAdjustmentModel');
const StockTransfer   = require('../models/stockTransferModel');
const Item            = require('../models/itemModel');

/**
 * Returns a map of `<itemId>_<warehouseId> -> currentStock`
 * by replaying openingStock + all adjustments + stockTransfers.
 */
async function fetchCurrentStockMap(warehouseId) {
  const whObjId = warehouseId && new mongoose.Types.ObjectId(warehouseId);

  // 1) Load every ledger row (various transactions) for this warehouse
  const [ledgerRows, adjustments, outs, ins] = await Promise.all([
    Inventory.find(whObjId ? { warehouse: whObjId } : {})
      .select('item warehouse quantity')
      .lean(),

    StockAdjustment.aggregate([
      ...(whObjId ? [{ $match: { warehouse: whObjId }}] : []),
      { $unwind: '$items' },
      { $group: {
          _id: '$items.item',
          totalAdj: { $sum: '$items.quantity' }
      }}
    ]),

    // Outgoing transfers
    StockTransfer.aggregate([
      ...(whObjId ? [{ $match: { fromWarehouse: whObjId }}] : []),
      { $unwind: '$items' },
      { $group: {
          _id: '$items.item',
          totalOut: { $sum: '$items.quantity' }
      }}
    ]),

    // Incoming transfers
    StockTransfer.aggregate([
      ...(whObjId ? [{ $match: { toWarehouse: whObjId }}] : []),
      { $unwind: '$items' },
      { $group: {
          _id: '$items.item',
          totalIn: { $sum: '$items.quantity' }
      }}
    ]),
  ]);

  // Turn adjustment arrays into lookup maps
  const adjMap = new Map(adjustments.map(r => [r._id.toString(), r.totalAdj]));
  const outMap = new Map(outs.map(r => [r._id.toString(), r.totalOut]));
  const inMap  = new Map(ins.map(r => [r._id.toString(), r.totalIn]));

  // 2) Build final stock: for each ledgerRow, overwrite to keep only last
  //    (we assume Inventory.quantity is a running balance, but we'll
  //     recalc ourselves to be sure)
  const latestLedger = new Map();
  for (const row of ledgerRows) {
    const key = `${row.item.toString()}_${row.warehouse.toString()}`;
    latestLedger.set(key, row.quantity);
  }

  // 3) Now for each unique key, recompute:
  //     openingStock (from Item model) + adjustments + ins - outs
  const stockMap = new Map();
  for (const key of latestLedger.keys()) {
    const [itemId, whId] = key.split('_');
    // fetch openingStock from Item (or its variant)
    const itemDoc = await Item.findById(itemId).lean();
    const baseOpening = itemDoc?.openingStock || 0;

    const totalAdj  = adjMap.get(itemId) || 0;
    const totalOut  = outMap.get(itemId) || 0;
    const totalIn   = inMap.get(itemId)  || 0;

    const current = baseOpening + totalAdj + totalIn - totalOut;
    stockMap.set(key, current);
  }

  return stockMap;
}

module.exports = { fetchCurrentStockMap };
