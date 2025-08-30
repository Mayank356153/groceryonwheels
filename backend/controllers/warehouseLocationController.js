// controllers/warehouseLocationController.js
const asyncHandler      = require("express-async-handler");
const WarehouseLocation = require("../models/warehouseLocationModel");

exports.updateWarehouseLocation = asyncHandler(async (req, res) => {
  const { warehouseId, lat, lng } = req.body; // Extract warehouseId from body

  if (!warehouseId) {
    return res.status(400).json({ message: "warehouseId is required" });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ message: "Invalid lat or lng" });
  }

  const point = { type: "Point", coordinates: [lngNum, latNum] };

  const loc = await WarehouseLocation.findOneAndUpdate(
    { warehouse: warehouseId },
    { coords: point, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: loc });
});

exports.getWarehouseLocation = asyncHandler(async (req, res) => {
  const loc = await WarehouseLocation.findOne({
    warehouse: req.params.warehouseId
  });
  if (!loc) return res.status(404).json({ message: "No location found" });
  res.json({ success: true, data: loc });
});

exports.getNearbyWarehouses = asyncHandler(async (req, res) => {
  const lat   = parseFloat(req.query.lat),
        lng   = parseFloat(req.query.lng),
        radius= parseFloat(req.query.radius) || 5000;
  if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  const nearby = await WarehouseLocation.find({
    coords: {
      $near: {
        $geometry:    { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius
      }
    }
  });
  res.json({ success: true, data: nearby });
});
