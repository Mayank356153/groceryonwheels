// helpers/stock.js
const mongoose        = require('mongoose');
const Item            = require('../models/itemModel');
const { buildStockMaps } = require('./stockMaps');

async function getCurrentStock(itemId, warehouseId) {
  // 1️⃣ build all eight stock‐flow maps for this warehouse
  const widObj = new mongoose.Types.ObjectId(warehouseId);
  const maps   = await buildStockMaps(widObj);
  const g      = (m, k) => m[k] || 0;

  // 2️⃣ figure out the “opening” stock (handles variants)
  let opening = 0;
  const doc = await Item.findOne({
    $or: [
      { _id: itemId },           // top‑level item
      { 'variants._id': itemId } // variant inside an item
    ]
  })
  .select('openingStock itemGroup variants')
  .lean();

  if (doc) {
    if (doc.itemGroup === 'Variant') {
      const v = doc.variants.find(v => v._id.toString() === itemId.toString());
      opening = v ? (v.openingStock || 0) : 0;
    } else {
      opening = doc.openingStock || 0;
    }
  }

  // 3️⃣ pull each total from the maps
  const k = itemId.toString();
  const totalAdjustment    = g(maps.adjMap,  k);
  const totalIn            = g(maps.inMap,   k);
  const totalOut           = g(maps.outMap,  k);
  const totalPurchased     = g(maps.purMap,  k);
  const totalReturned      = g(maps.rtMap,   k);
  const totalSold          = g(maps.posMap,  k);
  const totalSalesSold     = g(maps.saleMap, k);
  const totalReturnedSold  = g(maps.srtMap,  k);

  // 4️⃣ compute the “current” stock exactly as in your controller
  const current =
      opening
    + totalPurchased   - totalReturned
    + totalAdjustment  + totalIn
    - totalOut         - totalSold
    - totalSalesSold   + totalReturnedSold;

  return current;
}

module.exports = { getCurrentStock };
