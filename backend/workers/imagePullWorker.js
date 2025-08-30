// imagePullCron.js
const cron = require('node-cron');
const { processSingleJob } = require('../helpers/imagePullQueue');

let busy = false;

cron.schedule('* * * * *', async () => {
  if (busy) {
    return; // ensure strictly one at a time
  }
  busy = true;
  try {
    await processSingleJob({
      perItemTimeoutMs: 240_000, // 4 minutes if you really need it
      maxAttempts: 2
    });
  } catch (e) {
    console.error('[ImagePullWorker] top-level error', e);
  } finally {
    busy = false;
  }
});
