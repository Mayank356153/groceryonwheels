const express = require("express");
const { getPosSettings, updatePosSettings } = require("../controllers/posSettingsController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// GET POS settings – require authentication and "View" permission for POS Settings.
router.get(
  "/",
  authMiddleware,
  hasPermission("POS Settings", "View"),
  getPosSettings
);

// UPDATE POS settings – require authentication and "Edit" permission for POS Settings.
router.put(
  "/",
  authMiddleware,
  hasPermission("POS Settings", "Edit"),
  updatePosSettings
);

module.exports = router;
