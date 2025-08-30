require("dotenv").config();
const mongoose = require("mongoose");
const Ledger   = require("../models/ledgerModel");
const Purchase     = require("../models/purchaseModel");
const PosOrder     = require("../models/PosOrder");
const SalesReturn  = require("../models/SalesReturn");



/* Purchase (isReturn: false) */
async function sumModelRange(
  Model,
  match,
  start,
  end,
  dateField   = "createdAt",
  amountField = "grandTotal"
) {
  const [{ total = 0 } = {}] = await Model.aggregate([
    {
      $match: {
        ...match,
        [dateField]: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: null, total: { $sum: `$${amountField}` } } }
  ]);

  return total;
}

/* Purchase (isReturn: false) */
function sumPurchase(start, end, wid) {
  return sumModelRange(
    Purchase,
    { warehouse: new mongoose.Types.ObjectId(wid), isReturn: false },
    start, end,
    "purchaseDate",      //  ← date field in Purchase
    "grandTotal"         //  ← amount field in Purchase
  ).catch(() => 0);
}

/* POS Sale */
const toId = id => new mongoose.Types.ObjectId(id);

/* POS Sale */
function sumPosSale(start, end, wid) {
  return sumModelRange(
    PosOrder,
    { warehouse: toId(wid) },      // ← wrap again
    start, end,
    "createdAt",
    "totalAmount"
  ).catch(() => 0);
}

/* Sale Return */
function sumSaleReturn(start, end, wid) {
  return sumModelRange(
    SalesReturn,
    { warehouse: toId(wid) },      // ← wrap again
    start, end,
    "returnDate",
    "totalRefund"
  ).catch(() => 0);
}

/* Purchase Return (isReturn: true) */
function sumPurchaseReturn(start, end, wid) {
  return sumModelRange(
    Purchase,
    { warehouse: new mongoose.Types.ObjectId(wid), isReturn: true },
    start, end,
    "purchaseDate",
    "grandTotal"
  ).catch(() => 0);
}



// ─── parse “YYYY-MM-DD” into a Date at UTC midnight ──────────────────────
function parseUtcDay(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

// ─── sum a ledger‐type (e.g. DEPOSIT, CASH_SALE…) for each day in [start→end] ─
async function sumRangeByDay(type, startDate, endDate, warehouseId) {
  let total = 0;
  const day  = new Date(startDate); day.setUTCHours(0, 0, 0, 0);
  const last = new Date(endDate);   last.setUTCHours(0, 0, 0, 0);

  while (day <= last) {
    const dayStart = new Date(day);
    const dayEnd   = new Date(day); dayEnd.setUTCHours(23, 59, 59, 999);

    const [{ daily = 0 } = {}] = await Ledger.aggregate([
      { $match: {
          warehouse: new mongoose.Types.ObjectId(warehouseId),
          type,
          date: { $gte: dayStart, $lte: dayEnd }
      }},
      { $group: { _id: null, daily: { $sum: "$amount" } } }
    ]);

    total += daily;
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return total;
}

// ─── sum each day’s LATEST CLOSING_BALANCE in [start→end] ──────────────────
async function sumDailyClosingBalances(startDate, endDate, warehouseId) {
  let total = 0;
  const day  = new Date(startDate); day.setUTCHours(0, 0, 0, 0);
  const last = new Date(endDate);   last.setUTCHours(0, 0, 0, 0);

  while (day <= last) {
    const dayStart = new Date(day);
    const dayEnd   = new Date(day); dayEnd.setUTCHours(23, 59, 59, 999);

    const entry = await Ledger.findOne({
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      type:      "CLOSING_BALANCE",
      date:      { $gte: dayStart, $lte: dayEnd }
    })
    .sort({ date: -1 })
    .lean();

    if (entry) total += entry.amount;
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return total;
}

// ─── sum each day’s OPENING_BALANCE (balanceBefore at 00:00) ───────────────
async function sumDailyOpeningBalances(startDate, endDate, warehouseId) {
  let total = 0;
  const day  = new Date(startDate); day.setUTCHours(0, 0, 0, 0);
  const last = new Date(endDate);   last.setUTCHours(0, 0, 0, 0);

  while (day <= last) {
    const moment = new Date(day);

    // find last closing before this day (balanceBefore)
    const prev = await Ledger.findOne({
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      type:      "CLOSING_BALANCE",
      date:      { $lt: moment }
    })
    .sort({ date: -1 })
    .lean();

    let openAmt;
    if (prev) {
      openAmt = prev.amount;
    } else {
      const [{ total: sumPrior = 0 } = {}] = await Ledger.aggregate([
        { $match: {
            warehouse: new mongoose.Types.ObjectId(warehouseId),
            date:      { $lt: moment },    // strictly before
            type:      { $ne: "CLOSING_BALANCE" }
        }},
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      openAmt = sumPrior;
    }

    total += openAmt;
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return total;
}

// ─── sum each day’s latest VAN_CASH in [start→end] and get latest remark ───
async function sumDailyVanCash(startDate, endDate, warehouseId) {
  const [{ total = 0 } = {}] = await Ledger.aggregate([
    {
      $match: {
        warehouse: new mongoose.Types.ObjectId(warehouseId),
        type:      "VAN_CASH",
        date:      { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const latestVanCash = await Ledger.findOne({
    warehouse: new mongoose.Types.ObjectId(warehouseId),
    type:      "VAN_CASH",
    date:      { $gte: startDate, $lte: endDate }
  })
  .sort({ date: -1 })
  .lean();

  return {
    amount: total,
    remark: latestVanCash?.remark || ""
  };
}

// ─── compute “liveBalance” for today ───────────────────────────
async function getCurrentLiveBalance(warehouseId) {
  const today    = new Date(); today.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setUTCHours(23, 59, 59, 999);

  const [
    opening,
    cash,
    bank,
    hold,
    deposit,
    transfer,
    vanCashResult
  ] = await Promise.all([
    sumDailyOpeningBalances(today, todayEnd, warehouseId),
    sumRangeByDay("CASH_SALE",      today, todayEnd, warehouseId),
    sumRangeByDay("BANK_SALE",      today, todayEnd, warehouseId),
    sumRangeByDay("HOLD",           today, todayEnd, warehouseId),
    sumRangeByDay("DEPOSIT",        today, todayEnd, warehouseId),
    sumRangeByDay("MONEY_TRANSFER", today, todayEnd, warehouseId),
    sumDailyVanCash(today, todayEnd, warehouseId)
  ]);

  const beforeX = opening + deposit + cash;
  const afterX  = beforeX - transfer;
  const diff    = vanCashResult.amount ? vanCashResult.amount - beforeX : 0;

  return afterX + diff;
}

// ─── Controller: GET /api/cash-summary?warehouseId=…&start=…&end=… ───────
exports.getCashSummary = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { warehouseId, date, start: qStart, end: qEnd } = req.query;
      if (!warehouseId) {
        return res.status(400).json({ message: "warehouseId is required" });
      }

      // 1) build UTC-midnight range
      let startDate, endDate;
      if (qStart && qEnd) {
        startDate = parseUtcDay(qStart);
        endDate   = parseUtcDay(qEnd);
        endDate.setUTCHours(23, 59, 59, 999);
      } else {
        const pick = date || new Date().toISOString().slice(0,10);
        startDate = parseUtcDay(pick);
        endDate   = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);
      }

      // 2) compute range‐sums
      const [
        openingSum,
        depositSum,
        cashSum,
        bankSum,
        transferSum,
        purchaseSum,          // regular Purchase
  posSaleSum,           // POS orders
  purchaseRetSum,       // Purchase Return
  saleRetSum,  
        vanCashResult,
        closingSum
      ] = await Promise.all([
        sumDailyOpeningBalances(startDate,   endDate,          warehouseId),
        sumRangeByDay("DEPOSIT",        startDate, endDate, warehouseId),
        sumRangeByDay("CASH_SALE",      startDate, endDate, warehouseId),
        sumRangeByDay("BANK_SALE",      startDate, endDate, warehouseId),
        sumRangeByDay("MONEY_TRANSFER", startDate, endDate, warehouseId),
        sumPurchase          (startDate, endDate, warehouseId),
  sumPosSale           (startDate, endDate, warehouseId),
  sumPurchaseReturn    (startDate, endDate, warehouseId),
  sumSaleReturn        (startDate, endDate, warehouseId),
        sumDailyVanCash(startDate,      endDate,          warehouseId),
        sumDailyClosingBalances(startDate, endDate,        warehouseId)
      ]);

      const totalSale = cashSum + bankSum;

      // 3) compute **last‐day** flows & recompute closingBalance
      const lastDayStart = new Date(endDate); lastDayStart.setUTCHours(0, 0, 0, 0);
      const lastDayEnd   = new Date(lastDayStart); lastDayEnd.setUTCHours(23, 59, 59, 999);

      const [
        openingLastDay,
        depositLastDay,
        cashSaleLastDay,
        bankSaleLastDay,
        moneyTransferLastDay,
        vanCashLastDay
      ] = await Promise.all([
        sumDailyOpeningBalances(lastDayStart, lastDayEnd, warehouseId),
        sumRangeByDay("DEPOSIT",        lastDayStart, lastDayEnd, warehouseId),
        sumRangeByDay("CASH_SALE",      lastDayStart, lastDayEnd, warehouseId),
        sumRangeByDay("BANK_SALE",      lastDayStart, lastDayEnd, warehouseId),
        sumRangeByDay("MONEY_TRANSFER", lastDayStart, lastDayEnd, warehouseId),
        sumDailyVanCash(lastDayStart,   lastDayEnd,    warehouseId)
      ]);

      const beforeTransfers = openingLastDay + depositLastDay + cashSaleLastDay;
      const afterTransfers  = beforeTransfers - moneyTransferLastDay;
      const diffLastDay     = vanCashLastDay.amount
        ? vanCashLastDay.amount - beforeTransfers
        : 0;
      const closingBalance  = vanCashLastDay.amount
        ? afterTransfers + diffLastDay
        : afterTransfers;

      // 4) upsert the new CLOSING_BALANCE for last day
      await Ledger.findOneAndUpdate(
        {
          warehouse: warehouseId,
          type:      "CLOSING_BALANCE",
          date:      { $gte: lastDayStart, $lte: lastDayEnd }
        },
        {
          $set: {
            amount: closingBalance,
            date:   lastDayEnd
          }
        },
        { upsert: true, session }
      );

      // 5) compute today’s liveBalance
      const liveBalance = await getCurrentLiveBalance(warehouseId);
      let totalClosingBalanceInRange;
      if (qStart && qEnd) {
        totalClosingBalanceInRange =
          await sumDailyClosingBalances(startDate, endDate, warehouseId);
      } else {
        totalClosingBalanceInRange = closingBalance;
      }

      // 6) return everything
      res.json({
        openingBalance:             openingSum,
        deposit:                    depositSum,
        cashSale:                   cashSum,
        bankSale:                   bankSum,
        totalSale,
          purchase:                   purchaseSum,
  posSale:                    posSaleSum,
  purchaseReturn:             purchaseRetSum,
  saleReturn:                 saleRetSum,

        moneyTransfer:              transferSum,
        vanCash:                    vanCashResult.amount,
        vanCashRemark:              vanCashResult.remark,
        diff:                       diffLastDay,
        closingBalance,
        totalClosingBalanceInRange,
        liveBalance
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};
