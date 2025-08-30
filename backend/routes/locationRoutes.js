const router       = require("express").Router();
const { protect }  = require("../middleware/customerauthMiddleware");
const commonAuth   = require("../middleware/commonAuth");  // or "commonAuthMiddleware"
const loc          = require("../controllers/locationController");

// 1) Customer (or rider) pushes their own live coords
router.post("/", protect, loc.updateLocation);

// 2) (Optional) Find everyone nearby
router.get("/nearby", commonAuth, loc.getNearby);

// 3) Fetch one user’s last known location
router.get("/:userId", commonAuth, loc.getLocation);

module.exports = router;
