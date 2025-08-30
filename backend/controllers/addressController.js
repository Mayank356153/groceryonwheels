// controllers/addressController.js
const asyncHandler = require('express-async-handler');
const Address      = require('../models/addressModel');

const getPoint = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null;
  return { type: 'Point', coordinates: [lngNum, latNum] };
};

/* ───────── CREATE ───────── */
exports.createAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const {
    label, street, area, city, state,
    country, postalCode, isDefault = false,
    lat, lng                       // ← NEW (optional)
  } = req.body;

  const doc = {
    user: userId, label, street, area, city,
    state, country, postalCode, isDefault
  };
  const point = getPoint(lat, lng);
  if (point) doc.location = point;

  const addr = await Address.create(doc);

  if (isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addr._id } },
      { isDefault: false }
    );
  }
  res.status(201).json({ success: true, data: addr });
});

// GET /api/addresses
exports.getAddresses = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const list = await Address.find({ user: userId })
                            .sort({ isDefault: -1, updatedAt: -1 });
  res.json({ success: true, data: list });
});

// GET /api/addresses/:id
exports.getAddressById = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const addr = await Address.findOne({
    _id: req.params.id,
    user: userId
  });
  if (!addr) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: addr });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { lat, lng, ...rest } = req.body;

  const update = { ...rest };
  const point  = getPoint(lat, lng);
  if (point)   update.location = point;          // only set if sent

  const addr = await Address.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    update,
    { new: true }
  );
  if (!addr) return res.status(404).json({ message: 'Not found or forbidden' });

  if (update.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addr._id } },
      { isDefault: false }
    );
  }
  res.json({ success: true, data: addr });
});

// DELETE /api/addresses/:id
exports.deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await Address.deleteOne({
    _id: req.params.id,
    user: userId
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Not found or forbidden" });
  }
  res.json({ success: true, message: "Deleted" });
});

exports.getAllAddressesWithUser = asyncHandler(async (req, res) => {
  const list = await Address.find({})
    .populate('user', 'name email')   // assumes Address.user is ObjectId→Customer
    .sort({ 'user.name': 1, isDefault: -1, updatedAt: -1 });
  res.json({ success: true, data: list });
});

exports.getNearbyAddresses = asyncHandler(async (req, res) => {
  const lat    = parseFloat(req.query.lat);
  const lng    = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 5000;   // default 5 km
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'lat & lng required' });
  }

  const list = await Address.find({
    location: {
      $near: {
        $geometry:    { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius
      }
    }
  }).populate('user', 'name email');

  res.json({ success: true, data: list });
});