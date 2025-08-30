
// services/recordSale.js
require("dotenv").config();

const Account = require("../models/accountModel");
const Warehouse = require("../models/warehouseModel");
const Ledger = require("../models/ledgerModel");

const CASH_ID = process.env.CASH_PAYMENT_TYPE_ID || "685177e9dd0744ba797e7cb2";
const BANK_ID = process.env.BANK_PAYMENT_TYPE_ID || "685177f3dd0744ba797e7cbc";
const HOLD_ID = process.env.HOLD_PAYMENT_TYPE_ID || "685177fadd0744ba797e7cc6";

async function recordSale({ warehouseId, payments, referenceId, refModel, session = null }) {
  if (!payments?.length) return;

  // 1) Remove any old cash/bank entries for this invoice
  await Ledger.deleteMany(
    {
      warehouse: warehouseId,
      referenceId,
      refModel,
      type: { $in: ["CASH_SALE", "BANK_SALE"] },
    },
    { session }
  );

  console.log("payments", payments);

  // 2) Add fresh ledger entries based on current payments[]
  for (const pay of payments) {
    if (!pay.amount) continue;

    let type = null;
    if (String(pay.paymentType) === CASH_ID) type = "CASH_SALE";
    else if (String(pay.paymentType) === BANK_ID) type = "BANK_SALE";
    if (!type) continue;

    await Ledger.create(
      [
        {
          date: pay.paymentDate ? new Date(pay.paymentDate) : new Date(), // Use paymentDate
          type,
          amount: pay.amount,
          warehouse: warehouseId,
          referenceId, // Tie back to invoice
          refModel, // e.g., 'Sale' or 'PosOrder'
        },
      ],
      { session }
    );
  }
}

module.exports = { recordSale };