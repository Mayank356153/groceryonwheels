const asyncHandler  = require("express-async-handler");
const DeviceToken   = require("../models/deviceTokenModel");
const admin       = require("../lib/fcm");

/* POST /api/push/register-token
   Body: { "deviceToken":"AAA...", "platform":"android" | "ios" }
*/
exports.registerToken = asyncHandler(async (req, res) => {
  const { deviceToken, platform } = req.body;
  if (!deviceToken || !platform)
    return res.status(400).json({ message: "deviceToken & platform are required" });

  await DeviceToken.findOneAndUpdate(
    { customer: req.user, token: deviceToken },          // query
    { customer: req.user, token: deviceToken, platform, updatedAt: new Date() }, // update
    { upsert: true, new: true }
  );

  res.json({ message: "Token registered" });
});

exports.broadcastPush = asyncHandler(async (req, res) => {
  const { title, body } = req.body;

  const tokens = await DeviceToken.distinct("token");
  while (tokens.length) {
    await admin.messaging().sendEachForMulticast({
      tokens: tokens.splice(0, 500),   // FCM limit 500
      notification: { title, body }
    });
  }
  res.json({ message: "Broadcast sent" });
});

exports.sendToOne = asyncHandler(async (req, res) => {
  const { customerId, title, body } = req.body;
  if (!customerId || !title || !body) {
    return res.status(400).json({ message: "customerId, title & body are required" });
  }

  // 1) Look up all FCM/APNs tokens for that customer
  const tokens = await DeviceToken.find({ customer: customerId })
                                  .distinct("token");
  if (!tokens.length) {
    return res.status(404).json({ message: "No devices registered for that user" });
  }

  // 2) Send the notification to each token (in batches of 500)
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body }
  });

  // 3) Return success
  res.json({ message: "Notification sent to user" });
});