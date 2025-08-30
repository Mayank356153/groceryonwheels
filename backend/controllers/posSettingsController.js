const PosSettings = require("../models/posSettingsModel");

// GET /api/pos-settings
exports.getPosSettings = async (req, res) => {
  try {
    // Find the system-wide settings; populate defaultAccount if it's defined as a reference.
    let settings = await PosSettings.findOne().populate("defaultAccount");
    // If no settings exist yet, create a new default settings document.
    if (!settings) {
      settings = await PosSettings.create({});
      settings = await PosSettings.findById(settings._id).populate("defaultAccount");
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching POS settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/pos-settings
exports.updatePosSettings = async (req, res) => {
  try {
    // Update or create (upsert) the settings document.
    const updatedSettings = await PosSettings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    ).populate("defaultAccount");
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating POS settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
