const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/customerauthMiddleware");
const { addNotification, getNotifications } = require("../controllers/notificationController");

router.post("/add", protect, addNotification);
router.get("/", protect, getNotifications);

module.exports = router;
