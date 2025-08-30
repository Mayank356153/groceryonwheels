const mongoose = require('mongoose');
const cron = require('node-cron');
const Item = require('../models/itemModel');
const path = require('path');
const fs = require('fs').promises;

// Schema for scheduled deletions
const deletionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  filename: { type: String, required: true },
  scheduledAt: { type: Date, required: true }
}, { timestamps: true });

const Deletion = mongoose.model('Deletion', deletionSchema);

// Schedule deletion for an image
async function scheduleDeletion(itemId, filename) {
  const scheduledAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
  await Deletion.create({ itemId, filename, scheduledAt });
}

// Cancel deletion for an item
async function cancelDeletion(itemId) {
  await Deletion.deleteMany({ itemId });
}

// Run daily at midnight to process deletions
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Starting image deletion cleanup...');
    const now = new Date();
    const deletions = await Deletion.find({ scheduledAt: { $lte: now } }).lean();

    for (const del of deletions) {
      const filePath = path.join(__dirname, '..', 'Uploads', 'qr', 'items', del.filename);
      try {
        await fs.unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
      } catch (err) {
        console.warn(`Failed to delete ${filePath}:`, err.message);
      }
      // Remove from itemImages
      await Item.findByIdAndUpdate(del.itemId, {
        $pull: { itemImages: del.filename }
      });
      // Delete the schedule
      await Deletion.deleteOne({ _id: del._id });
    }
    console.log('Image deletion cleanup completed.');
  } catch (err) {
    console.error('Image deletion cleanup error:', err);
  }
});

module.exports = { scheduleDeletion, cancelDeletion };