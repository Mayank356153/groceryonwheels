// routes/warehouseLocationRoutes.js
const router      = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const commonAuth  = require("../middleware/commonAuth");
const ctrl        = require("../controllers/warehouseLocationController");

// 1) Warehouse (via its JWT) updates its coords
router.post(
  "/",
  authMiddleware,                   // ensure they have the right permission
  ctrl.updateWarehouseLocation
);

// 2) Any authenticated user fetches one warehouse’s location
router.get(
  "/nearby",       // put this before the param route!
  commonAuth,
  ctrl.getNearbyWarehouses
);

// 3) Fetch a single warehouse’s last known spot
router.get(
  "/:warehouseId",
  commonAuth,
  ctrl.getWarehouseLocation
);

module.exports = router;