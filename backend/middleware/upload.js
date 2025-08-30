const multer = require("multer");
const path = require("path");

// Custom file filter (optional but recommended)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/riders");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Create configured multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Export specific upload methods for different use cases
module.exports = {
  singleUpload: (fieldName) => upload.single(fieldName),
  arrayUpload: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  fieldsUpload: (fields) => upload.fields(fields),
  anyUpload: () => upload.any() // Use with caution
};
