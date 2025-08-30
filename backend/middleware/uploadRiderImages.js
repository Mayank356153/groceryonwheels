const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/riders folder exists
const uploadDir = path.join(__dirname, "../uploads/riders");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Handle multiple fields
module.exports = upload.fields([
  { name: "addharCardImage", maxCount: 10 },
  { name: "panCardImage", maxCount: 10 },
  { name: "profileImage", maxCount: 10 },
  { name: "drivingLicenseImage", maxCount: 10 }
]);
