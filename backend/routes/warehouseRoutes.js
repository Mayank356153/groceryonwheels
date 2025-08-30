// routes/warehouseRoutes.js

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getNearbyWarehouses,
  getWarehouseInventory,
  getWarehouseList,
  getWarehouseStockSummary} = require('../controllers/warehouseController');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');
const Warehouse = require('../models/warehouseModel');

const router = express.Router();

// Multer config for QR uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/qr')),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* ==================== WAREHOUSE ROUTES ==================== */


router.get('/by-cash-account/:accountId', async (req, res) => {
  try {
    const wh = await Warehouse
      .findOne({ cashAccount: req.params.accountId })
      .select('_id warehouseName');
    if (!wh) return res.status(404).json({ message: 'Warehouse not found' });
    return res.json({ warehouseId: wh._id, warehouseName: wh.warehouseName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// CREATE Warehouse
router.post(
  '/warehouses',
  authMiddleware,
  hasPermission('Warehouses', 'Add'),
  upload.single('qrCode'),  // ← parses form-data into req.body & req.file
  createWarehouse
);

// GET All Warehouses
router.get(
  '/warehouses',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getAllWarehouses
);

router.get(
  '/summary',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getWarehouseStockSummary
);



router.get(
  '/warehouses/list',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getWarehouseList
);

// GET Nearby Warehouses
router.get(
  '/warehouses/near',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getNearbyWarehouses
);

// GET Single Warehouse
router.get(
  '/warehouses/:id',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getWarehouseById
);

// GET Warehouse Inventory
router.get(
  '/warehouses/:id/inventory',
  authMiddleware,
  hasPermission('Warehouses', 'View'),
  getWarehouseInventory
);

// UPDATE Warehouse
router.put(
  '/warehouses/:id',
  authMiddleware,
  hasPermission('Warehouses', 'Edit'),
  upload.single('qrCode'),
  updateWarehouse
);

// DELETE Warehouse
router.delete(
  '/warehouses/:id',
  authMiddleware,
  hasPermission('Warehouses', 'Delete'),
  deleteWarehouse
);

module.exports = router;
