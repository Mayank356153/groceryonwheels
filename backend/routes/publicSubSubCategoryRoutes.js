const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/customerauthMiddleware');
const {
  getAllSubSubCategories,
  getSubSubCategoryById
} = require('../controllers/categoryController');

// Customer-facing sub-subcategory list and detail
router.get('/sub-subcategories',     protect, getAllSubSubCategories);
router.get('/sub-subcategories/:id', protect, getSubSubCategoryById);

module.exports = router;