// routes/items-link-images.js
const router = require("express").Router();
const mongoose = require("mongoose");
const Item = require("../models/itemModel");
const { findByCode } = require("../lib/imageIndex"); // reuse helper above

// Recommended for speed if not present:
// Item.collection.createIndex({ imageCode: 1 });

router.post("/link-images", async (req, res) => {
  const { warehouseId, overwrite = false, dryRun = false, limit = 0 } = req.body || {};

  const query = { imageCode: { $exists: true, $ne: "" } };
  if (!overwrite) query.$or = [{ itemImages: { $exists: false } }, { itemImages: { $size: 0 } }];
  if (warehouseId) query.warehouse = new mongoose.Types.ObjectId(warehouseId);

  const items = await Item.find(query).limit(limit || 0).lean();

  let updated = 0, noMatch = 0;
  for (const it of items) {
    const urls = await findByCode(it.imageCode);
    if (!urls.length) { noMatch++; continue; }
    if (!dryRun) await Item.updateOne({ _id: it._id }, { $set: { itemImages: urls } });
    updated++;
  }
  res.json({ success: true, scanned: items.length, updated, noMatch, dryRun });
});

module.exports = router;
