const admin        = require("../lib/fcm");
const DeviceToken  = require("../models/deviceTokenModel");

async function sendToCustomer(customerId, { title, body, data }) {
  const tokens = await DeviceToken.find({ customer: customerId }).distinct("token");
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data                        // optional deep-link payload
  });
}

module.exports = { sendToCustomer };
