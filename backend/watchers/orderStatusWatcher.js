const Order             = require("../models/orderModel");
const { sendToCustomer } = require("../services/pushService");

function titleBody(orderNumber, status) {
  if (status === "on the way")
    return ["Order on the Way", `Your order #${orderNumber} is out for delivery.`];
  if (status === "delivered")
    return ["Order Delivered",  `Your order #${orderNumber} has been delivered.`];
  return [];
}

module.exports = function startOrderWatcher() {
  // watch only for status field updates:
  const stream = Order.watch([
    { $match: { "updateDescription.updatedFields.status": { $exists: true } } }
  ]);

  stream.on("change", async change => {
    const id        = change.documentKey._id;
    const newStatus = change.updateDescription.updatedFields.status;

    const order = await Order.findById(id).select("customer orderNumber");
    if (!order) return;

    const [title, body] = titleBody(order.orderNumber, newStatus);
    if (!title) return;                               // ignore other statuses

    await sendToCustomer(order.customer, {
      title, body,
      data: { orderId: String(id), status: newStatus }
    });
  });

  stream.on("error", err => console.error("Order watcher error:", err));
};
