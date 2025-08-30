// services/recordTransfer.js
require('dotenv').config();
const Account = require('../models/accountModel');

/**
 * Atomically moves funds from one account to another.
 *
 * @param {Object} opts
 * @param {String} opts.debitAccount   – the Account _id to debit
 * @param {String} opts.creditAccount  – the Account _id to credit
 * @param {Number} opts.amount         – the amount to transfer
 * @param {Object} [opts.session]      – optional mongoose session for transactions
 */
async function recordTransfer({ debitAccount, creditAccount, amount, session = null }) {
  if (!debitAccount || !creditAccount) {
    throw new Error("Both debitAccount and creditAccount are required");
  }
  if (!amount || amount <= 0) return;

  await Account.bulkWrite(
    [
      {
        updateOne: {
          filter: { _id: debitAccount },
          update: { $inc: { currentBalance: -amount } },
          ...(session && { session })
        }
      },
      {
        updateOne: {
          filter: { _id: creditAccount },
          update: { $inc: { currentBalance: amount } },
          ...(session && { session })
        }
      }
    ],
    { ordered: true }
  );
}

module.exports = { recordTransfer };
