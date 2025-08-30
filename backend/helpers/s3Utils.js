const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { pullFromS3 } = require('../utils/s3Pull');
const BUCKET = process.env.AWS_BUCKET;
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.fetchImagesFromS3 = async (req, res) => {
  const codes = Array.isArray(req.body.keys) ? [...new Set(req.body.keys)] : [];
  const uploadedImages = {};
  const notFound = [];

  try {
    let ContinuationToken = undefined;
    const allObjs = [];
    do {
      const resp = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken
      }));
      allObjs.push(...(resp.Contents || []));
      ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : null;
    } while (ContinuationToken);

    for (const code of codes) {
      const needle   = (code || '').toLowerCase().trim();   // <- NEW
 const matches  = allObjs.filter(o =>
   o.Key.toLowerCase().includes(needle)
 );
      if (!matches.length) {
        notFound.push(code);
        continue;
      }

      uploadedImages[code] = [];
      for (const obj of matches) {
        const fname = await pullFromS3(obj.Key);
        uploadedImages[code].push(fname);
      }
    }

    return res.json({ success: true, uploadedImages, notFound });
  } catch (err) {
    console.error('[S3-pull]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};