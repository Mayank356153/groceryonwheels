require("dotenv").config();
const mongoose = require("mongoose");
const Ledger = require("../models/ledgerModel");
const Sale = require("../models/Sales");
const PosOrder = require("../models/PosOrder");
const Account = require("../models/accountModel");
const Warehouse = require("../models/warehouseModel");

// ─── Parse "YYYY-MM-DD" into a Date at local midnight (IST) ─────────────────
function parseLocalDay(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)); // Use UTC to align with MongoDB
}

// ─── Format UTC date to IST YYYY-MM-DD ─────────────────────────────────────
function formatISTDate(date) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000) // Add IST offset (+5:30)
    .toISOString()
    .split("T")[0];
}

// ─── Controller: GET /api/cash-sale-details ───────────────────────────────
exports.getCashSaleDetails = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { warehouseId, accountId, start, end, page = 1, limit = 20 } = req.query;

      // 1) Build query filters
      const filters = { type: "CASH_SALE" };
      if (warehouseId) {
        filters.warehouse = new mongoose.Types.ObjectId(warehouseId);
      }
      if (start && end) {
        const startDate = parseLocalDay(start);
        const endDate = parseLocalDay(end);
        endDate.setHours(23, 59, 59, 999);
        filters.date = { $gte: startDate, $lte: endDate };
      } else {
        // Default to today in IST (May 14, 2025)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Local midnight IST
        const todayUTC = new Date(today.getTime() - 5.5 * 60 * 60 * 1000); // Convert to UTC
        const todayEnd = new Date(todayUTC);
        todayEnd.setHours(23, 59, 59, 999);
        filters.date = { $gte: todayUTC, $lte: todayEnd };
      }

      // 2) Pagination
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      // 3) Aggregate cash sales
      const pipeline = [
        { $match: filters },
        // Lookup warehouse
        {
          $lookup: {
            from: "warehouses",
            localField: "warehouse",
            foreignField: "_id",
            as: "warehouse",
          },
        },
        { $unwind: { path: "$warehouse", preserveNullAndEmptyArrays: true } },
        // Lookup reference (Sale or PosOrder)
        {
          $lookup: {
            from: "sales",
            let: { refId: "$referenceId", refModel: "$refModel" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$refModel", "Sale"] },
                      { $eq: ["$_id", "$$refId"] },
                    ],
                  },
                },
              },
            ],
            as: "sale",
          },
        },
        {
          $lookup: {
            from: "posorders",
            let: { refId: "$referenceId", refModel: "$refModel" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$refModel", "PosOrder"] },
                      { $eq: ["$_id", "$$refId"] },
                    ],
                  },
                },
              },
            ],
            as: "posorder",
          },
        },
        // Combine sale and posorder into a single field
        {
          $set: {
            reference: {
              $cond: {
                if: { $gt: [{ $size: "$sale" }, 0] },
                then: { $arrayElemAt: ["$sale", 0] },
                else: { $arrayElemAt: ["$posorder", 0] },
              },
            },
          },
        },
        { $unwind: { path: "$reference", preserveNullAndEmptyArrays: true } },
        // Lookup account from reference
        {
          $lookup: {
            from: "accounts",
            localField: "reference.account",
            foreignField: "_id",
            as: "account",
          },
        },
        { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
        // Filter by accountId if provided
        ...(accountId
          ? [
              {
                $match: {
                  "account._id": new mongoose.Types.ObjectId(accountId),
                },
              },
            ]
          : []),
        // Lookup items from reference.items
        {
          $unwind: { path: "$reference.items", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "items",
            localField: "reference.items.item",
            foreignField: "_id",
            as: "reference.items.item",
          },
        },
        {
          $unwind: {
            path: "$reference.items.item",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Group back to reconstruct items array
        {
          $group: {
            _id: "$_id",
            date: { $first: "$date" },
            amount: { $first: "$amount" },
            warehouse: { $first: "$warehouse" },
            account: { $first: "$account" },
            referenceId: { $first: "$referenceId" },
            refModel: { $first: "$refModel" },
            items: {
              $push: {
                itemId: "$reference.items.item._id",
                itemName: "$reference.items.item.itemName",
                itemCode: "$reference.items.item.itemCode",
                quantity: "$reference.items.quantity",
                price: "$reference.items.price",
              },
            },
          },
        },
        // Filter out empty items and handle null fields
        {
          $set: {
            items: {
              $filter: {
                input: "$items",
                as: "item",
                cond: { $ne: ["$$item.itemId", null] },
              },
            },
            account: { $ifNull: ["$account", null] }, // Ensure null if no account
          },
        },
        // Sort by date descending
        { $sort: { date: -1 } },
        // Pagination
        { $skip: skip },
        { $limit: limitNum },
      ];

      const cashSales = await Ledger.aggregate(pipeline).session(session);

      // 4) Get total count for pagination
      const countPipeline = [
        { $match: filters },
        ...(accountId
          ? [
              {
                $lookup: {
                  from: "sales",
                  let: { refId: "$referenceId", refModel: "$refModel" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$refModel", "Sale"] },
                            { $eq: ["$_id", "$$refId"] },
                          ],
                        },
                      },
                    },
                  ],
                  as: "sale",
                },
              },
              {
                $lookup: {
                  from: "posorders",
                  let: { refId: "$referenceId", refModel: "$refModel" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$refModel", "PosOrder"] },
                            { $eq: ["$_id", "$$refId"] },
                          ],
                        },
                      },
                    },
                  ],
                  as: "posorder",
                },
              },
              {
                $set: {
                  reference: {
                    $cond: {
                      if: { $gt: [{ $size: "$sale" }, 0] },
                      then: { $arrayElemAt: ["$sale", 0] },
                      else: { $arrayElemAt: ["$posorder", 0] },
                    },
                  },
                },
              },
              { $unwind: { path: "$reference", preserveNullAndEmptyArrays: true } },
              {
                $match: {
                  "reference.account": new mongoose.Types.ObjectId(accountId),
                },
              },
            ]
          : []),
        { $count: "total" },
      ];

      const [{ total: totalCount = 0 } = {}] = await Ledger.aggregate(countPipeline).session(session);

      // 5) Format response with IST dates
      const formatted = cashSales.map((sale) => ({
        date: formatISTDate(sale.date), // Convert UTC to IST YYYY-MM-DD
        amount: sale.amount,
        warehouse: sale.warehouse
          ? { _id: sale.warehouse._id, name: sale.warehouse.warehouseName }
          : null,
        account: sale.account
          ? { _id: sale.account._id, name: sale.account.accountName }
          : null,
        items: sale.items.map((item) => ({
          itemId: item.itemId || null,
          itemName: item.itemName || "Unknown Item",
          itemCode: item.itemCode || "",
          quantity: item.quantity || 0,
          price: item.price || 0,
        })),
        referenceId: sale.referenceId,
        refModel: sale.refModel,
      }));

      // 6) Return response
      return res.json({
        success: true,
        data: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    });
  } catch (err) {
    console.error("Error in getCashSaleDetails:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  } finally {
    session.endSession();
  }
};