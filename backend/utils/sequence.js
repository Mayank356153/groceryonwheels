// utils/sequence.js
const Counter = require("../models/counterModel");

/**
 * Atomically increments and returns the next sequence number for a given key.
 *
 * @param {string} key  – the name of the sequence (e.g. "saleCode")
 * @returns {Promise<number>}
 */
async function getNextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },                    // ← match on _id
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,                  // insert if missing
      setDefaultsOnInsert: true      // apply defaults on insert if schema has them
    }
  );
  return doc.seq;
}

function formatCode(prefix, seq) {
  const year = new Date().getFullYear();
  return `${prefix}/${year}/${String(seq).padStart(7, "0")}`;
}

module.exports = { getNextSequence, formatCode };
