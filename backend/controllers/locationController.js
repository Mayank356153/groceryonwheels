// controllers/locationController.js
const Location = require("../models/locationModel");

// 1) Update or create the user’s location
exports.updateLocation = async (req, res) => {
  const user   = req.user;   // set by protect/commonAuth
  const { lat, lng } = req.body;
  const point = { type:"Point", coordinates:[lng,lat] };

  const loc = await Location.findOneAndUpdate(
    { user },
    { coords: point, updatedAt: new Date() },
    { upsert:true, new:true }
  );
  res.json({ success:true, data:loc });
};

// 2) Fetch someone’s last position
exports.getLocation = async (req, res) => {
  const loc = await Location.findOne({ user: req.params.userId });
  if (!loc) return res.status(404).json({ message:"No location found" });
  res.json({ success:true, data:loc });
};

// 3) (Optional) geo-query
exports.getNearby = async (req, res) => {
  const { lat, lng, radius=5000 } = req.query;  // radius in meters
  const users = await Location.find({
    coords: { 
      $near: { $geometry:{ type:"Point", coordinates:[+lng,+lat] }, $maxDistance:+radius }
    }
  });
  res.json({ success:true, data:users });
};
