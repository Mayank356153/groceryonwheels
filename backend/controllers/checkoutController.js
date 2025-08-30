const Item            = require("../models/itemModel");
const CartItem        = require("../models/CartItem");
const CheckoutSession = require("../models/checkoutSessionModel");
const {addOrderNotification} =require("./notificationController")
const asyncHandler    = require("express-async-handler");
const customer=require("../models/customerModel")
const crypto = require("crypto");
const Razorpay = require("razorpay");


const razorPay_instance=new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET
})





// POST /checkout  – create a session from the current cart
exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const customerId = req.user;
  // 1) pull the cart
  const cartRows = await CartItem.find({ customer: customerId });
  if (!cartRows.length) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  // 2) price each line
  let sessionItems = [];
  let totalAmount  = 0;

  for (const row of cartRows) {
    const dbItem = await Item.findById(row.item).select("salesPrice");
    if (!dbItem) continue;                       // ignore deleted items

    const lineTotal = dbItem.salesPrice * row.quantity;
    totalAmount    += lineTotal;

    sessionItems.push({
      item:       row.item,
      quantity:   row.quantity,
      salesPrice: dbItem.salesPrice
    });
  }

  // 3) create the session
  const session = await CheckoutSession.create({
    customer: customerId,
    items:    sessionItems,
    amount:   totalAmount
  });

  
  const options = {
  amount: totalAmount * 100, // amount in paisa
  currency: "INR",
  receipt: `receipt_${session._id}`,
  payment_capture: 1,
  notes: {
    orderId: session._id.toString()
  }
};


let razorpayOrder;
try {
  razorpayOrder = await razorPay_instance.orders.create(options);
} catch (error) {
  console.log(error)
  return res.status(500).json({ success: false, message: "checkout created & Failed to create Razorpay order", error: error.message });
}


await CheckoutSession.findByIdAndUpdate(session._id,{
  razorpayId:razorpayOrder.id
})

 


  // 4) return summary
  res.status(201).json({
    success: true,
    data: {
      checkoutSessionId: session._id,
      amount:            session.amount,
      items:             session.items,
      expiresAt:         session.expiresAt,
      razorpayId:razorpayOrder.id
    }
  });
});



// //verify payment 

exports.verifyPayment=async(req,res)=>
  {
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body;
       const key_secret=process.env.RAZORPAY_KEY_SECRET;
       const generated_signature=crypto.createHmac('sha256',key_secret)
                         .update(razorpay_order_id + "|" + razorpay_payment_id)
                         .digest('hex');
                         
        const checkoutSessionExist=await CheckoutSession.findOne({
          razorpayId: razorpay_order_id
        })
      
        if(generated_signature !== razorpay_signature){
            addOrderNotification(req.user.id,checkoutSessionExist._id,"Fail")
          return res.status(400).json({
            success:false,
            message:"Payment verification failed",
          })
        } 
      

      if(!checkoutSessionExist){
        return res.status(400).json({
          message:"No such scheckout session exist"
        })
      }

      addOrderNotification(req.user.id,checkoutSessionExist._id,"Paid")




        await CheckoutSession.findOneAndUpdate(
  { razorpayId: razorpay_order_id },
  {
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paymentVerifiedAt: new Date()
  }
);
     
        return res.status(200).json({
          message:"Payment verified successfully",
          success:true,})
      
}
