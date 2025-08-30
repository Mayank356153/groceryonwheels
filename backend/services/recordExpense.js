require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Atomically updates a single account's balance for an expense/income transaction.
 *
 * @param {Object} opts
 * @param {String} opts.account   – the Account _id to update
 * @param {Number} opts.amount    – the amount to adjust
 * @param {String} opts.inOut     – "In" to increase balance, "Out" to decrease
 * @param {Object} [opts.session] – optional mongoose session for transactions
 */
async function recordExpense({ account, amount, inOut, session = null }) {
  if (!account) {
    throw new Error("Account is required");
  }
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!["In", "Out"].includes(inOut)) {
    throw new Error("Invalid inOut value; must be 'In' or 'Out'");
  }

  const Account = mongoose.model("Account");
  const balanceChange = inOut === "In" ? amount : -amount;
  await Account.bulkWrite(
    [
      {
        updateOne: {
          filter: { _id: account },
          update: { $inc: { currentBalance: balanceChange } },
          ...(session && { session })
        }
      }
    ],
    { ordered: true }
  );
}

module.exports = { recordExpense };