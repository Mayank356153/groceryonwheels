// scripts/backfill‑variant‑inventory.js

const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
dotenv.config();                // if you store your MONGODB_URI in .env
const Item       = require('../models/itemModel');
const Inventory  = require('../models/inventoryModel');

// reuse your helper
async function updateInventory(wid, iid, delta) {
  return Inventory.findOneAndUpdate(
    { warehouse: new mongoose.Types.ObjectId(wid), item: new mongoose.Types.ObjectId(iid) },
    { $inc: { quantity: delta }, $set: { lastUpdated: new Date() } },
    { new: true, upsert: true }
  );
}

async function backfill() {
  await mongoose.connect(process.env.MONGODB_URI);
  const variantsOnly = await Item.find({ itemGroup: "Variant" }).lean();
  for (const parent of variantsOnly) {
    for (const v of parent.variants) {
      console.log(`Seeding variant ${v._id} at warehouse ${parent.warehouse} -> openingStock ${v.openingStock}`);
      await updateInventory(parent.warehouse, v._id, Number(v.openingStock) || 0);
    }
  }
  console.log("Backfill complete");
  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});

