// services/recordDeposit.js
const Account = require('../models/accountModel');

/**
 * Atomically credits a single account by `amount`.
 * @param {Object} opts
 * @param {String} opts.creditAccount  – the Account _id to credit
 * @param {Number} opts.amount         – the amount to add
 * @param {ClientSession} [opts.session]
 */
async function recordDeposit({ creditAccount, amount, session = null }) {
  if (!creditAccount) throw new Error('creditAccount is required');
  if (!amount || amount <= 0) return;

  await Account.updateOne(
    { _id: creditAccount },
    { $inc: { currentBalance: amount } },
    session ? { session } : {}
  );
}

module.exports = { recordDeposit };
