const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/customerauthMiddleware');
const {
  getAllSubCategories,
  getSubCategoryById
} = require('../controllers/categoryController');

// Customer-facing subcategory list and detail
router.get('/subcategories',      protect, getAllSubCategories);
router.get('/subcategories/:id',  protect, getSubCategoryById);

module.exports = router;