const express = require('express');
const router = express.Router();
const { getLiveStock, countNonStockItems, deleteNonStockItems } = require('../controllers/stockCtrl');

router.get('/countNonStockItems', countNonStockItems);
router.delete('/deleteNonStockItems', deleteNonStockItems);
router.get('/:invId', getLiveStock);

module.exports = router;