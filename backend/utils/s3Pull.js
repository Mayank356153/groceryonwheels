// utils/s3Pull.js
const fs   = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.pullFromS3 = async key => {
  const destDir = path.resolve(__dirname, '..', 'uploads', 'qr', 'items');
  await fs.promises.mkdir(destDir, { recursive: true });

  // If you want to keep the original filename instead of timestamping, just do:
  // const filename = path.basename(key);
  const filename = `${Date.now()}-${path.basename(key)}`; 
  const destAbs  = path.join(destDir, filename);

  if (fs.existsSync(destAbs)) return filename;  // already pulled

  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key:    key
  }));

  await pipeline(Body, fs.createWriteStream(destAbs));
  return filename;
};
