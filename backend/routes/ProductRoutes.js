const express = require('express');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');
const { createProduct, getAllProducts, updateProduct, deleteProduct, getProductById } = require('../controllers/ProductController');


const router = express.Router();
const {fieldsUpload}= require("../middleware/upload")

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/banners'); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });



router.post("/add",upload.array("media"),createProduct)

router.get("/all",  getAllProducts);


module.exports = router;