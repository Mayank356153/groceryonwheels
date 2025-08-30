// helpers/stockMaps.js
const mongoose        = require("mongoose");                // ← for ObjectId
const StockAdjustment = require("../models/stockAdjustmentModel");
const StockTransfer   = require("../models/stockTransferModel");
const Purchase        = require("../models/purchaseModel");
const PosOrder        = require("../models/PosOrder");
const Sales           = require("../models/Sales");
const SalesReturn     = require("../models/SalesReturn");
const Audit           =require("../models/AuditModel");
/* tiny util: rows → { id: total } map */
const asMap = (rows, field) =>
  rows.reduce((m, r) => ((m[r._id.toString()] = r[field]), m), {});

/* -----------------------------------------------------------
   Build eight stock-totals maps in ONE Promise.all
   Returns an object with properties:
     adjMap, inMap, outMap, purMap, rtMap,
     posMap, saleMap, srtMap
-------------------------------------------------------------*/
exports.buildStockMaps = async (warehouseOid) => {
  const whMatch      = warehouseOid ? { warehouse: warehouseOid } : {};
  const inMatch      = warehouseOid ? { toWarehouse: warehouseOid } : {};
  const outMatch     = warehouseOid ? { fromWarehouse: warehouseOid } : {};
  const posWhMatch   = warehouseOid ? { warehouse: warehouseOid } : {};
  const salesWhMatch = warehouseOid ? { warehouse: warehouseOid } : {};
  const AuditWh=warehouseOid ? { warehouseId: warehouseOid} : {};
  const [
    adjRows, inRows, outRows, purRows, retRows,
    posRows, salesRows, sRetRows,auditRows
  ] = await Promise.all([
    StockAdjustment.aggregate([
      { $match: whMatch },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalAdjustment: { $sum: "$items.quantity" } } }
    ]),
    StockTransfer.aggregate([
      { $match: inMatch },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalIn: { $sum: "$items.quantity" } } }
    ]),
    StockTransfer.aggregate([
      { $match: outMatch },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalOut: { $sum: "$items.quantity" } } }
    ]),
    Purchase.aggregate([
      { $match: { ...whMatch, isReturn: false } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalPurchased: { $sum: "$items.quantity" } } }
    ]),
    Purchase.aggregate([
      { $match: { ...whMatch, isReturn: true } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalReturned: { $sum: "$items.quantity" } } }
    ]),
    PosOrder.aggregate([
      { $match: { ...posWhMatch, status: { $nin: ["OnHold", "Cancelled"] } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalSold: { $sum: "$items.quantity" } } }
    ]),
    Sales.aggregate([
      { $match: { ...salesWhMatch, status: { $nin: ["Draft", "Cancelled"] } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalSalesSold: { $sum: "$items.quantity" } } }
    ]),
    SalesReturn.aggregate([
      { $match: { ...whMatch, status: { $in: ["Return", "CancelledReturn"] } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.item", totalReturnedSold: { $sum: "$items.quantity" } } }
    ]),
    Audit.aggregate([
      { $match:  {...AuditWh} },
      { $unwind:"$items" },
      {$group:{_id:"$items.itemId",totalAuditAdjust:{$sum:{$subtract:["$items.scannedQty", "$items.expectedQty"]}}}}
    ])
  ]);

  return {
    adjMap  : asMap(adjRows,  "totalAdjustment"),
    inMap   : asMap(inRows,   "totalIn"),
    outMap  : asMap(outRows,  "totalOut"),
    purMap  : asMap(purRows,  "totalPurchased"),
    rtMap   : asMap(retRows,  "totalReturned"),
    posMap  : asMap(posRows,  "totalSold"),
    saleMap : asMap(salesRows,"totalSalesSold"),
    srtMap  : asMap(sRetRows, "totalReturnedSold"),
    auditMap  : asMap(auditRows, "totalAuditAdjust")
  };
};
