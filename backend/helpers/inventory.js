// helpers/inventory.js
{/*const mongoose  = require('mongoose');
const Inventory = require('../models/inventoryModel');

async function updateInventory(warehouseId, itemId, quantityDelta) {
  return Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item:      new mongoose.Types.ObjectId(itemId),
    },
    { 
      $inc:   { quantity: quantityDelta },
      $set:   { lastUpdated: new Date() }
    },
    { new: true, upsert: true }
  );
}

module.exports = { updateInventory };*/}
// helpers/inventory.js
{/*const mongoose = require('mongoose');
const Inventory = require('../models/inventoryModel');
const Item = require('../models/itemModel');
const { getLiveStock } = require('../controllers/stockCtrl');
const { scheduleDeletion, cancelDeletion } = require('./deletionScheduler');
const { fetchImagesFromS3 } = require('./s3Utils'); // Updated import

const fs = require('fs').promises;

async function updateInventory(warehouseId, itemId, quantityDelta) {
  // 1️⃣ Update inventory
  const inv = await Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item: new mongoose.Types.ObjectId(itemId),
    },
    { 
      $inc: { quantity: quantityDelta },
      $set: { lastUpdated: new Date() }
    },
    { new: true, upsert: true }
  );

  // 2️⃣ Get current stock
  const stockResponse = await new Promise((resolve, reject) => {
    getLiveStock(
      { params: { invId: itemId }, query: { warehouse: warehouseId } },
      { json: data => resolve(data), status: (code) => ({ json: () => reject(new Error(`Status ${code}`)) }) }
    );
  });
  const currentStock = stockResponse.currentStock || 0;

  // 3️⃣ Load item details
  const item = await Item.findById(itemId).select('itemImages imageCode openingStock').lean();

  if (!item) return inv;

  // 4️⃣ Handle stock changes
  if (currentStock <= 0) {
    // Schedule deletion for each image
    for (const filename of item.itemImages || []) {
      await scheduleDeletion(itemId, filename);
    }
  } else {
    // Cancel any pending deletions
    await cancelDeletion(itemId);

    // Re-pull images if stock > 0, openingStock was 0, and no images exist
    if (item.openingStock === 0 && (!item.itemImages || item.itemImages.length === 0) && item.imageCode) {
      const s3Response = await new Promise((resolve, reject) => {
        fetchImagesFromS3(
          { body: { keys: [item.imageCode] } },
          { json: data => resolve(data), status: (code) => ({ json: () => reject(new Error(`Status ${code}`)) }) }
        );
      });
      const uploadedImages = s3Response.uploadedImages || {};
      const images = uploadedImages[item.imageCode] || [];
      if (images.length > 0) {
        await Item.findByIdAndUpdate(itemId, { $set: { itemImages: images } });
      }
    }
  }

  return inv;
}

module.exports = { updateInventory };*/}

{/*const mongoose = require('mongoose');
const Inventory = require('../models/inventoryModel');
const Item = require('../models/itemModel');
const { getLiveStock } = require('../controllers/stockCtrl');
const { fetchImagesFromS3 } = require('./s3Utils');
const { scheduleDeletion, cancelDeletion } = require('./deletionScheduler');

async function updateInventory(warehouseId, itemId, quantityDelta, context = 'default') {
  try {
    // Get the pre-update inventory state
    const previousInventory = await Inventory.findOne({
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item: new mongoose.Types.ObjectId(itemId)
    }).sort({ lastUpdated: -1 }).limit(1);
    const wasZero = previousInventory ? previousInventory.quantity <= 0 : true; // True if no prior record

    // Perform the core inventory update
    const updatedRecord = await Inventory.findOneAndUpdate(
      {
        warehouse: new mongoose.Types.ObjectId(warehouseId),
        item: new mongoose.Types.ObjectId(itemId),
      },
      { 
        $inc: { quantity: quantityDelta },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );

    // Handle image-related logic based on context and quantity change
    if (updatedRecord) {
      const wasPositive = previousInventory ? previousInventory.quantity > 0 : false;
      const isZeroOrNegative = updatedRecord.quantity <= 0;
      const isPositive = updatedRecord.quantity > 0;

      // Schedule deletion if stock becomes 0 or negative
      if (isZeroOrNegative && wasPositive) {
        const item = await Item.findById(itemId).select('itemImages').lean();
        if (item && item.itemImages && item.itemImages.length > 0) {
          for (const filename of item.itemImages) {
            await scheduleDeletion(itemId, filename).catch(error => 
              console.error(`Failed to schedule deletion for ${filename}: ${error.message}`)
            );
          }
        }
      }

      // Cancel deletion if stock becomes positive from 0 or negative
      if (isPositive && wasZero) {
        await cancelDeletion(itemId).catch(error => 
          console.error(`Failed to cancel deletion for ${itemId}: ${error.message}`)
        );
      }

      // Fetch images for purchase context using getLiveStock for current stock
      if (context === 'purchase') {
        const stockResponse = await new Promise((resolve, reject) => {
          getLiveStock(
            { params: { invId: itemId }, query: { warehouse: warehouseId } },
            { json: data => resolve(data), status: (code) => ({ json: () => reject(new Error(`Status ${code}`)) }) }
          );
        });
        const currentStock = stockResponse.currentStock || 0;

        if (currentStock > 0 && wasZero) {
          const item = await Item.findById(itemId).select('itemImages imageCode openingStock').lean();
          console.log(`Checking image fetch for ${itemId}:`, { openingStock: item?.openingStock, itemImages: item?.itemImages, imageCode: item?.imageCode });
          if (item && item.openingStock === 0 && (!item.itemImages || item.itemImages.length === 0) && item.imageCode) {
            const s3Response = await fetchImagesFromS3({ body: { keys: [item.imageCode] } })
              .catch(error => {
                console.error(`Failed to fetch images for ${itemId}: ${error.message}`);
                return { uploadedImages: {} };
              });
            console.log(`S3 Response for ${itemId}:`, s3Response);
            const images = s3Response.uploadedImages?.[item.imageCode] || [];
            if (images.length > 0) {
              console.log(`Attempting to save images for ${itemId}:`, images);
              const updateResult = await Item.findByIdAndUpdate(itemId, { $set: { itemImages: images } }, { new: true })
                .catch(error => {
                  console.error(`Failed to update item images for ${itemId}: ${error.message}`);
                  return null;
                });
              if (updateResult) console.log(`Images saved for ${itemId}:`, updateResult.itemImages);
            } else {
              console.log(`No images fetched for ${itemId} from S3`);
            }
          } else {
            console.log(`Image fetch conditions not met for ${itemId}:`, { openingStock: item?.openingStock, itemImages: item?.itemImages, imageCode: item?.imageCode });
          }
        }
      }
    }

    return updatedRecord;
  } catch (error) {
    console.error(`Error in updateInventory: ${error.message}`, { warehouseId, itemId, quantityDelta, context });
    throw error;
  }
}

module.exports = { updateInventory };*/}

const mongoose = require('mongoose');
const Inventory = require('../models/inventoryModel');
const Item = require('../models/itemModel');
const { scheduleDeletion, cancelDeletion } = require('./deletionScheduler');
const { enqueueImagePull } = require('./imagePullQueue'); // will create next

async function updateInventory(warehouseId, itemId, quantityDelta) {
  const inv = await Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item:      new mongoose.Types.ObjectId(itemId)
    },
    {
      $inc:  { quantity: quantityDelta },
      $set:  { lastUpdated: new Date() }
    },
    { new: true, upsert: true }
  );

  const currentStock = inv.quantity || 0;

  const item = await Item.findById(itemId)
    .select('itemImages imageCode')
    .lean();
  if (!item) return inv;

  if (currentStock <= 0) {
    for (const f of item.itemImages || []) {
      await scheduleDeletion(itemId, f);
    }
  } else {
    await cancelDeletion(itemId);
    if ((!item.itemImages || !item.itemImages.length) && item.imageCode) {
      await enqueueImagePull(item._id, item.imageCode);
    }
  }
  return inv;
}

module.exports = { updateInventory };
