// imagePullQueue.js
const mongoose = require('mongoose');
const Item = require('../models/itemModel');
const { fetchImagesFromS3 } = require('./s3Utils'); // your existing function

const imagePullSchema = new mongoose.Schema({
  itemId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  imageCode:    { type: String, required: true },

  status:       { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending', index: true },
  attempts:     { type: Number, default: 0 },
  lastError:    { type: String },

  scheduledAt:  { type: Date, default: () => new Date(), index: true },
  lockedAt:     { type: Date },

  durationMs:   { type: Number },
  s3DurationMs: { type: Number },
  imageCount:   { type: Number, default: 0 }
}, { timestamps: true });

imagePullSchema.index({ itemId: 1 }, { unique: true });
imagePullSchema.index({ status: 1, scheduledAt: 1 });

const ImagePull = mongoose.model('ImagePull', imagePullSchema);

async function enqueueImagePull(itemId, imageCode) {
  // upsert ensures single doc per itemId
  await ImagePull.updateOne(
    { itemId },
    {
      $setOnInsert: {
        itemId,
        imageCode,
        status: 'pending',
        scheduledAt: new Date()
      }
    },
    { upsert: true }
  );
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms))
  ]);
}

async function recoverStaleLocks({ staleAfterMs = 10 * 60 * 1000 } = {}) {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const res = await ImagePull.updateMany(
    { status: 'running', lockedAt: { $lte: cutoff } },
    {
      $set: {
        status: 'pending',
        lastError: 'stale lock recovered',
        scheduledAt: new Date()
      },
      $unset: { lockedAt: 1 }
    }
  );
  if (res.modifiedCount) {
    console.log(`[ImagePullWorker] Recovered ${res.modifiedCount} stale jobs`);
  }
}

async function claimNextJob() {
  return ImagePull.findOneAndUpdate(
    {
      status: 'pending',
      scheduledAt: { $lte: new Date() }
    },
    {
      $set: { status: 'running', lockedAt: new Date() }
    },
    { sort: { scheduledAt: 1 }, new: true } // earliest first
  );
}

async function processSingleJob({
  perItemTimeoutMs = 60_000,
  maxAttempts = 5
} = {}) {
  // 1) recover stale locks (quick)
  await recoverStaleLocks();

  // 2) claim a job
  const job = await claimNextJob();
  if (!job) {
    // nothing to do this tick
    return;
  }

  const jobStart = Date.now();
  try {
    const item = await Item.findById(job.itemId).select('itemImages imageCode').lean();
    if (!item) throw new Error('item missing');

    // Already has images? Finish immediately.
    if (item.itemImages && item.itemImages.length) {
      await ImagePull.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'done',
            attempts: job.attempts + 1,
            durationMs: Date.now() - jobStart,
            s3DurationMs: 0,
            imageCount: item.itemImages.length
          },
          $unset: { lockedAt: 1 }
        }
      );
      console.log(`[ImagePullWorker] SKIP item=${job.itemId} already has images`);
      return;
    }

    const fetchStart = Date.now();
    const s3Resp = await withTimeout(
      new Promise((resolve, reject) => {
        fetchImagesFromS3(
          { body: { keys: [job.imageCode] } },
          {
            json: d => resolve(d),
            status: c => ({ json: () => reject(new Error(`HTTP ${c}`)) })
          }
        );
      }),
      perItemTimeoutMs
    );
    const s3Elapsed = Date.now() - fetchStart;

    const images = (s3Resp.uploadedImages || {})[job.imageCode] || [];
    if (!images.length) throw new Error('no images found');

    await Item.findByIdAndUpdate(job.itemId, { $set: { itemImages: images } });

    await ImagePull.updateOne(
      { _id: job._id },
      {
        $set: {
          status: 'done',
          attempts: job.attempts + 1,
          durationMs: Date.now() - jobStart,
          s3DurationMs: s3Elapsed,
          imageCount: images.length
        },
        $unset: { lockedAt: 1 }
      }
    );
    console.log(`[ImagePullWorker] DONE item=${job.itemId} imgs=${images.length} s3Ms=${s3Elapsed}`);
  } catch (e) {
    const attempts = job.attempts + 1;
    if (attempts >= maxAttempts) {
      await ImagePull.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            attempts,
            lastError: e.message,
            durationMs: Date.now() - jobStart
          },
          $unset: { lockedAt: 1 }
        }
      );
      console.log(`[ImagePullWorker] FAIL item=${job.itemId} attempts=${attempts} err=${e.message}`);
    } else {
      const delayMin = Math.min(60, Math.pow(2, attempts)); // 2,4,8...
      await ImagePull.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'pending',
            attempts,
            lastError: e.message,
            durationMs: Date.now() - jobStart,
            scheduledAt: new Date(Date.now() + delayMin * 60_000)
          },
          $unset: { lockedAt: 1 }
        }
      );
      console.log(`[ImagePullWorker] RETRY item=${job.itemId} attempts=${attempts} nextIn=${delayMin}m err=${e.message}`);
    }
  }
}

module.exports = {
  enqueueImagePull,
  processSingleJob,
  ImagePull
};
