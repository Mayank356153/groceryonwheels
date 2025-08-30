const Notification = require("../models/Notification");

exports.addOrderNotification = async (customerId, orderNumber, event) => {
  try {
    let title = "";
    let body = "";

    if (event === "on_the_way") {
      title = "Order on the Way";
      body = `Your order #${orderNumber} has been dispatched and is on its way to you.`;
    } else if (event === "delivered") {
      title = "Order Delivered";
      body = `Your order #${orderNumber} has been delivered. Thank you for shopping with us!`;
    }
    else if(event=== "Paid"){
      title:"Payment Completed"
      body=`Payment for your order #${orderNumber} has been completed.`
    }
    else if(event=== "Fail"){
       title:"Payment Failed"
      body=`Payment for your order #${orderNumber} has been failed.`
    }
     else if(event==="OrderDelivered"){
       title:"Order Delivered"
      body=`Order #${orderNumber} has been delivered.`
    }
    else if(event==="OrderConfirmed"){
       title:"Order Confirmed"
      body=`Order #${orderNumber} has been Confirmed.`
    }
     else if(event==="OrderOut for Delivery"){
       title:"Out for delivery"
      body=`Order #${orderNumber} is out for delivery.`
    }
     else if(event==="OrderCancelled"){
       title:"Order Cancelled"
      body=`Order #${orderNumber} has been Cancelled.`
    }
     else if(event==="OrderReturned"){
       title:"Order Return"
      body=`Order #${orderNumber} has been returned.`
    }
    // Add additional events as needed

    const notification = new Notification({
      customer: customerId,
      title,
      body,
    });
    await notification.save();
    console.log("Notification saved:", notification);
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
};

exports.addNotification = async (req, res) => {
  try {
    const customerId = req.user;
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: "Title and body are required" });

    const notification = new Notification({ customer: customerId, title, body });
    await notification.save();
    res.status(201).json({ message: "Notification added", notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const customerId = req.user;
    const notifications = await Notification.find({ customer: customerId }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
