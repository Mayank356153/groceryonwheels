// controllers/stockCtrl.js
const mongoose              = require("mongoose");
const Item                  = require("../models/itemModel");
const { buildStockMaps }    = require("../helpers/stockMaps");   // <- same helper used by getAllItems

// controllers/stockCtrl.js
exports.getLiveStock = async (req, res) => {
  try {
    const { invId }     = req.params;
    const { warehouse } = req.query;
    if (!warehouse) return res.status(400).json({ message: "warehouse query-param required" });

    // validate IDs omitted for brevity…

    // 1️⃣ Pull the item *and* its home-warehouse
    const doc = await Item.findOne({
      $or: [ { _id: invId }, { "variants._id": invId } ]
    })
    .select("openingStock itemGroup variants warehouse") // include warehouse!
    .lean();
    


    let opening = 0;
    if (doc) {
      const homeWid = doc.warehouse.toString();
      // only use openingStock if this is the home warehouse
      if (homeWid === warehouse) {
        if (doc.itemGroup === "Variant") {
          const v = doc.variants.find(v => v._id.toString() === invId);
          opening = v?.openingStock || 0;
        } else {
          opening = doc.openingStock || 0;
        }
      }
    }

          
    // 2️⃣ Build the maps and compute all the flows exactly as before
    const widObj = new mongoose.Types.ObjectId(warehouse);
    const maps   = await buildStockMaps(widObj);
    const g      = (m, k) => m[k] || 0;
    const k      = invId.toString();

    const totals = {
      totalAdjustment   : g(maps.adjMap,   k),
      totalIn           : g(maps.inMap,    k),
      totalOut          : g(maps.outMap,   k),
      totalPurchased    : g(maps.purMap,   k),
      totalReturned     : g(maps.rtMap,    k),
      totalSold         : g(maps.posMap,   k),
      totalSalesSold    : g(maps.saleMap,  k),
      totalReturnedSold : g(maps.srtMap,   k),
    };

    // 3️⃣ Now opening is zero for non-home warehouses
    const current =
      opening
      + totals.totalPurchased   - totals.totalReturned
      + totals.totalAdjustment  + totals.totalIn
      - totals.totalOut         - totals.totalSold
      - totals.totalSalesSold   + totals.totalReturnedSold;

    return res.json({ currentStock: current });
  }
  catch (err) {
    console.error("getLiveStock:", err);
    return res.status(500).json({ message: "internal" });
  }
};

exports.countNonStockItems = async (req, res) => {
  try {
    // Fetch all items with relevant fields
    const items = await Item.find({}, { _id: 1, openingStock: 1, variants: 1, warehouse: 1, itemGroup: 1 }).lean();
    let nonStockCount = 0;

    // Group items by warehouse to optimize buildStockMaps calls
    const warehouseMap = new Map();
    for (const item of items) {
      const warehouseId = item.warehouse?.toString();
      if (!warehouseId) continue;
      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, []);
      }
      warehouseMap.get(warehouseId).push(item);
    }

    // Process each warehouse
    for (const [warehouseId, warehouseItems] of warehouseMap) {
      const maps = await buildStockMaps(new mongoose.Types.ObjectId(warehouseId));
      const g = (m, k) => m[k] || 0;

      for (const item of warehouseItems) {
        // Check top-level item
        const opening = item.openingStock || 0;
        const k = item._id.toString();
        const totals = {
          totalAdjustment: g(maps.adjMap, k),
          totalIn: g(maps.inMap, k),
          totalOut: g(maps.outMap, k),
          totalPurchased: g(maps.purMap, k),
          totalReturned: g(maps.rtMap, k),
          totalSold: g(maps.posMap, k),
          totalSalesSold: g(maps.saleMap, k),
          totalReturnedSold: g(maps.srtMap, k)
        };
        const currentStock = opening
          + totals.totalPurchased - totals.totalReturned
          + totals.totalAdjustment + totals.totalIn - totals.totalOut
          - totals.totalSold - totals.totalSalesSold + totals.totalReturnedSold;

        if (currentStock === 0) {
          nonStockCount++;
        }

        // Check variants
        if (item.itemGroup === "Variant" && item.variants?.length > 0) {
          for (const variant of item.variants) {
            const vOpening = variant.openingStock || 0;
            const vK = variant._id.toString();
            const vTotals = {
              totalAdjustment: g(maps.adjMap, vK),
              totalIn: g(maps.inMap, vK),
              totalOut: g(maps.outMap, vK),
              totalPurchased: g(maps.purMap, vK),
              totalReturned: g(maps.rtMap, vK),
              totalSold: g(maps.posMap, vK),
              totalSalesSold: g(maps.saleMap, vK),
              totalReturnedSold: g(maps.srtMap, vK)
            };
            const vCurrentStock = vOpening
              + vTotals.totalPurchased - vTotals.totalReturned
              + vTotals.totalAdjustment + vTotals.totalIn - vTotals.totalOut
              - vTotals.totalSold - vTotals.totalSalesSold + vTotals.totalReturnedSold;

            if (vCurrentStock === 0) {
              nonStockCount++;
            }
          }
        }
      }
    }

    res.json({ nonStockCount });
  } catch (err) {
    console.error("countNonStockItems:", err);
    res.status(500).json({ message: "internal" });
  }
};

exports.deleteNonStockItems = async (req, res) => {
  try {
    const { confirm } = req.query;
    if (confirm !== "true") {
      return res.status(400).json({ message: "Query param 'confirm=true' required" });
    }

    // Get all unique warehouse IDs
    const warehouseIds = await Item.distinct("warehouse");
    const warehouseObjIds = warehouseIds
      .filter(id => id)
      .map(id => new mongoose.Types.ObjectId(id.toString()));

    // Cache stock maps
    const stockMapsCache = new Map();
    for (const warehouseId of warehouseObjIds) {
      const maps = await buildStockMaps(warehouseId);
      stockMapsCache.set(warehouseId.toString(), maps);
    }

    // Process items in batches
    const batchSize = 1000;
    let skip = 0;
    let deletedItems = 0;
    let deletedVariants = 0;

    while (true) {
      const items = await Item.find({}, { _id: 1, openingStock: 1, variants: 1, warehouse: 1, itemGroup: 1 })
        .skip(skip)
        .limit(batchSize)
        .lean();
      if (items.length === 0) break;

      const itemsToDelete = [];
      const variantsToDelete = [];

      for (const item of items) {
        const homeWarehouseId = item.warehouse?.toString();
        if (!homeWarehouseId) continue;

        let hasNonZeroStock = false;

        for (const warehouseId of warehouseObjIds) {
          const maps = stockMapsCache.get(warehouseId.toString());
          const g = (m, k) => m[k] || 0;

          const opening = warehouseId.toString() === homeWarehouseId ? (item.openingStock || 0) : 0;
          const k = item._id.toString();
          const totals = {
            totalAdjustment: g(maps.adjMap, k),
            totalIn: g(maps.inMap, k),
            totalOut: g(maps.outMap, k),
            totalPurchased: g(maps.purMap, k),
            totalReturned: g(maps.rtMap, k),
            totalSold: g(maps.posMap, k),
            totalSalesSold: g(maps.saleMap, k),
            totalReturnedSold: g(maps.srtMap, k)
          };
          const currentStock = opening
            + totals.totalPurchased - totals.totalReturned
            + totals.totalAdjustment + totals.totalIn - totals.totalOut
            - totals.totalSold - totals.totalSalesSold + totals.totalReturnedSold;

          if (currentStock !== 0) {
            hasNonZeroStock = true;
            break;
          }
        }

        if (!hasNonZeroStock) {
          console.log(`Will delete item: ${item._id}`);
          itemsToDelete.push(item._id);
        }

        if (item.itemGroup === "Variant" && item.variants?.length > 0) {
          for (const variant of item.variants) {
            let variantHasNonZeroStock = false;

            for (const warehouseId of warehouseObjIds) {
              const maps = stockMapsCache.get(warehouseId.toString());
              const g = (m, k) => m[k] || 0;

              const vOpening = warehouseId.toString() === homeWarehouseId ? (variant.openingStock || 0) : 0;
              const vK = variant._id.toString();
              const vTotals = {
                totalAdjustment: g(maps.adjMap, vK),
                totalIn: g(maps.inMap, vK),
                totalOut: g(maps.outMap, vK),
                totalPurchased: g(maps.purMap, vK),
                totalReturned: g(maps.rtMap, vK),
                totalSold: g(maps.posMap, vK),
                totalSalesSold: g(maps.saleMap, vK),
                totalReturnedSold: g(maps.srtMap, vK)
              };
              const vCurrentStock = vOpening
                + vTotals.totalPurchased - vTotals.totalReturned
                + vTotals.totalAdjustment + vTotals.totalIn - vTotals.totalOut
                - vTotals.totalSold - vTotals.totalSalesSold + vTotals.totalReturnedSold;

              if (vCurrentStock !== 0) {
                variantHasNonZeroStock = true;
                break;
              }
            }

            if (!variantHasNonZeroStock) {
              console.log(`Will delete variant: ${variant._id} from item: ${item._id}`);
              variantsToDelete.push({ itemId: item._id, variantId: variant._id });
            }
          }
        }
      }

      if (itemsToDelete.length > 0) {
        const result = await Item.deleteMany({ _id: { $in: itemsToDelete } });
        deletedItems += result.deletedCount;
      }

      for (const { itemId, variantId } of variantsToDelete) {
        const result = await Item.updateOne(
          { _id: itemId },
          { $pull: { variants: { _id: variantId } } }
        );
        if (result.modifiedCount > 0) deletedVariants++;
      }

      skip += batchSize;
    }

    const deletedCount = deletedItems + deletedVariants;
    res.json({ message: `Deleted ${deletedCount} non-stock items/variants`, deletedCount });
  } catch (err) {
    console.error("deleteNonStockItems:", err);
    res.status(500).json({ message: "internal" });
  }
};