const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/customerauthMiddleware');
const { getAllCategories, getCategoryById } = require('../controllers/categoryController');

// Customer-facing category list and detail
router.get('/categories',      protect, getAllCategories);
router.get('/categories/:id',  protect, getCategoryById);

module.exports = router;