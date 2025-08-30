const Order = require('../models/orderModel');
const Item = require('../models/itemModel'); // Assuming you have an Item model to fetch item details
const { addOrderNotification } = require('./notificationController');
const CartItem = require('../models/CartItem'); // Assuming you have a CartItem 
const asyncHandler     = require("express-async-handler");
const CheckoutSession  = require("../models/checkoutSessionModel");
const Rider= require("../models/RiderModel")
const RiderAccount=require("../models/RiderAccount")
const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose=require("mongoose")
const Customer=require("../models/customerModel")



exports.getOrders = async (req, res, next) => {
  try {
    console.log("req.user:", req.user, "Type:", typeof req.user);

    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Explicitly convert req.user to ObjectId
    const customerId = new mongoose.Types.ObjectId(req.user);
    console.log("Querying orders for customerId:", customerId.toString());

    // Test query without populate first
    console.log("Executing raw query...");
    const rawOrders = await Order.find({ customer: customerId });
    console.log("Raw orders found:", rawOrders.map(order => order._id));

    // Apply populate
    const orders = await Order.find({ customer: customerId })
      .populate({
        path: "customer",
        select: "name phone email",
        match: { _id: customerId } // Ensure customer match
      })
      .populate({
        path: "items.item",
        select: "itemName salesPrice itemImages",
        populate: [
          { path: "brand", select: "brandName" },
          { path: "category", select: "name" }
        ]
      })
      .populate("deliveryAgent", "name phone")
      .populate("AssignTo", "name")
      .sort({ createdAt: -1 });

    console.log("Populated orders found:", orders.map(order => order._id));

    if (orders.length === 0) {
      return res.status(200).json({ success: true, message: "No orders found for this customer", data: [] });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error in getOrders:", error);
    next(error);
  }
};



// POST /api/orders - Create a new order
// exports.createOrder = async (req, res, next) => {
//   try {
//     const customerId = req.user;
//     const orderData = req.body;
//     // orderData should include an "items" array with itemId and quantity

//     let computedItems = [];
//     let totalAmount = 0;

//     // Loop through each item in the provided order data
//     for (let cartItem of orderData.items) {
//       // Lookup the item in the database
//       let item = await Item.findById(cartItem.itemId);
//       if (!item) {
//         return res.status(400).json({ message: `Item not found: ${cartItem.itemId}` });
//       }
//       // Use the salesPrice from the Item model
//       const salesPrice = item.salesPrice;
//       // Compute cost for the item
//       const itemTotal = salesPrice * cartItem.quantity;
//       totalAmount += itemTotal;

//       // Build order item using your orderItemSchema structure:
//       computedItems.push({
//         item: cartItem.itemId,
//         quantity: cartItem.quantity,
//         salesPrice // captured from the Item model
//       });
//     }

//     // Now use computedItems and totalAmount to create the order
//     const order = await Order.create({
//       orderNumber: orderData.orderNumber,
//       date: orderData.date,
//       items: computedItems,
//       amount: totalAmount,
//       status: orderData.status,
//       location: orderData.location,
//       customerName: orderData.customerName,
//       customerNumber: orderData.customerNumber,
//       customer:       customerId   // assuming this is provided from your authenticated user
//     });

//     await CartItem.deleteMany({ customer: customerId });

//     res.status(201).json({ success: true, data: order });
//   } catch (error) {
//     next(error);
//   }
// };



exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orderNumber,
        customer,
      country,
      state,
      city,
      houseNo,
      area,
      postalCode,
      locationLink,
      items,
      AssignTo,
      AssignToModel,
      paymentMethod = "COD",
      amount,
      tax = 0,
      shippingFee = 0,
      discountApplied = 0,
      finalAmount,
  razorpayPaymentId,
    razorpaySignature,
    paymentVerifiedAt
    } = req.body;

    // === 1. BASIC VALIDATION ===
    if (!mongoose.Types.ObjectId.isValid(customer)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid customer ID format" });
    }
   
   if(!orderNumber){
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }
   




    const existCustomer=await Customer.findById(customer)
    if(!existCustomer){
      return res.status(500).json({
        message:"No such customer exist"
      })
    }

    // === 2. ITEM VALIDATION ===
    const validationResults = {
      availableItems: [],
      unavailableItems: [],
      invalidItems: []
    };


    for (const [index, item] of items.entries()) {
      // Validate item ID format
      if (!mongoose.Types.ObjectId.isValid(item.item)) {
        validationResults.invalidItems.push({
          position: index,
          itemId: item.item,
          reason: "Invalid item ID format"
        });
        continue;
      }

      // Find the product
      const product = await Item.findById(item.item).session(session);
      if (!product) {
        validationResults.unavailableItems.push({
          position: index,
          itemId: item.item,
          reason: "Item not found"
        });
        continue;
      }

      // Validate quantity
      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        validationResults.unavailableItems.push({
          position: index,
          itemId: item.item,
          itemName: product.itemName,
          requested: quantity,
          reason: "Invalid quantity"
        });
        continue;
      }

      // Warehouse validation (if applicable)
      if (AssignToModel === "Warehouse" && AssignTo) {
        if (!product.warehouse || !product.warehouse.equals(AssignTo)) {
          validationResults.unavailableItems.push({
            position: index,
            itemId: item.item,
            itemName: product.itemName,
            requested: quantity,
            reason: "Item not available in specified warehouse",
            // availableInWarehouse: product.warehouse || null
          });
          continue;
        }
      }

      // Stock validation
      if (product.openingStock < quantity) {
        validationResults.unavailableItems.push({
          position: index,
          itemId: item.item,
          itemName: product.itemName,
          requested: quantity,
          available: product.openingStock,
          reason: "Insufficient stock"
        });
        continue;
      }

      // Item is available
      validationResults.availableItems.push({
        position: index,
        itemId: item.item,
        itemName: product.itemName,
        quantity,
        price: item.price || product.salesPrice,
        warehouse: product.warehouse
      });
    }


   if (validationResults.availableItems.length === 0) {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({
    success: false,
    message: "No valid items to create an order",
    validation: validationResults
  });
}


    // === 3. CREATE ORDER ===
    const orderData = {
        orderNumber,
      customer:customer,
      items: validationResults.availableItems.map(item => ({
        item: item.itemId,
        quantity: item.quantity,
        price: item.price
      })),
      unAvailableItems:validationResults.unavailableItems.map(item => ({
        item: item.itemId,
        quantity: item.quantity,
        price: item.price
      })) || [],     
      allItems:items.map(item => ({
        item: item.itemId,
        quantity: item.quantity,
        price: item.price
      })) || [],
      shippingAddress: { country, state, city, houseNo, area, postalCode, locationLink },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Completed",
      amount,
      tax,
      shippingFee,
      discountApplied,
      finalAmount:finalAmount,
      AssignTo: AssignTo || undefined,
      AssignToModel: AssignTo ? AssignToModel : undefined,
      status: "Pending",
      notes,
      razorpayPaymentId,
    razorpaySignature,
    paymentVerifiedAt
    };

    const order = new Order(orderData);
    const savedOrder = await order.save({ session });

    // === 4. UPDATE STOCK ===
    const stockUpdates = validationResults.availableItems.map(item => ({
      updateOne: {
        filter: { _id: item.itemId },
        update: { $inc: { openingStock: -item.quantity } }
      }
    }));

    if (stockUpdates.length > 0) {
      await Item.bulkWrite(stockUpdates, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // === 5. RETURN RESULTS ===
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.item', 'itemName barcode')
      .populate('customer');

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder
    });

  } catch (error) {
   
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during order creation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};




// controllers/orderController.js
exports.placeOrderFromSession = asyncHandler(async (req, res) => {
  const customerId = req.user;              // set by auth middleware

  const {
    checkoutSessionId,
    paymentMethod   = "COD",

    // ➊  The complete address comes from the client request
    //    (mobile app or Postman). locationLink can be a Google-Maps URL
    //    or any “share location” string the app captures.
    country,
    state,
    city,
    houseNo,
    area,
    postalCode,
    locationLink,
    AssignTo,
    AssignToModel,

    tax             = 0,
    shippingFee     = 0,
    discountApplied = 0
  } = req.body;

  /* 1) Fetch the checkout session and validate it */
  const session = await CheckoutSession.findOne({
    _id:      checkoutSessionId,
    customer: customerId,
    status:   "pending"
  });

  if (!session || session.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired checkout session" });
  }

  /* 2) Create the order from the session snapshot */
  const order = await Order.create({
    orderNumber: await generateNextOrderNumber(),
    customer:    customerId,

    items:       session.items,          // [{ item, quantity, salesPrice }]
    totalAmount: session.amount,

    // ➋  Save the address inside the array field `shippingAddress`
    shippingAddress: [{
      country,
      state,
      city,
      houseNo,
      area,
      postalCode,
      locationLink
    }],

    tax,
    shippingFee,
    discountApplied,
    finalAmount: session.amount + tax + shippingFee - discountApplied,

    paymentMethod,

    razorpayPaymentId: session.razorpayPaymentId,
    razorpaySignature: session.razorpaySignature,
    paymentVerifiedAt: session.paymentVerifiedAt,

    AssignTo,
    AssignToModel
  });

  /* 3) Finalise session & clear the cart */
  session.status = "completed";
  await session.save();
  await CartItem.deleteMany({ customer: customerId });

  /* 4) Respond */
  res.status(201).json({ success: true, data: order });
});

/* ───────────────── helper: auto-increment SO/YY/#### ────── */
async function generateNextOrderNumber () {
  const year = new Date().getFullYear().toString().slice(-2);          // "25"
  const last = await Order.findOne().sort({ createdAt: -1 })
                          .select("orderNumber");
  const lastSeq = last && last.orderNumber?.split("/")?.[2];
  const nextSeq = String((parseInt(lastSeq, 10) || 0) + 1).padStart(4, "0");
  return `SO/${year}/${nextSeq}`;
}




// PUT /api/orders/:id - Update an existing order
exports.updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    // First, retrieve the current order to check its previous status.
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const previousStatus = currentOrder.status;

    // Now, update the order with the new data.
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if status has been updated and trigger a notification accordingly.
    if (updateData.status && updateData.status.toLowerCase() !== previousStatus.toLowerCase()) {
      const newStatus = updateData.status.toLowerCase();

      if (newStatus === "on the way") {
        await addOrderNotification(updatedOrder.customer, updatedOrder.orderNumber, "on_the_way");
      } else if (newStatus === "delivered") {
        await addOrderNotification(updatedOrder.customer, updatedOrder.orderNumber, "delivered");
      }
      // You can add more status events here as needed.
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};


//get order by id
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const order = await Order.findById(id)
      // 1️⃣  Items
      .populate({
        path: 'items.item',
        select: 'itemName salesPrice itemImages',       // only what UI needs
        populate: [
          { path: 'brand',    select: 'brandName' },
          { path: 'category', select: 'name'       }
        ]
      })
      // 2️⃣  Customer
      .populate('customer', 'name phone email')
      // 3️⃣  Delivery agent / warehouse
      .populate('deliveryAgent', 'name phone')
      .populate('AssignTo',      'name')
      // 4️⃣  Slot (if any)
      
      .lean();                                    // return plain JS object

    if (!order) {
      return res.status(404).json({ message: "No such order exists" });
    }

    /* OPTIONAL: graceful fallback so UI never breaks */
    order.items = order.items.map(l => {
      if (!l.item) {
        return { ...l, itemName: "Unknown Product", price: 0 };
      }
      // expose flat props the app expects
      return {
        ...l,
        itemName: l.item.itemName,
        price:     l.price ?? l.item.salesPrice,
        image:     l.item.itemImage
      };
    });

    res.status(200).json({ message: "Order found", data: order });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// controllers/orderController.js   (add to bottom)


//get all orders
exports.getAllOrders=async (req,res)=>{
 try {
  const data = await Order.find().sort()
  .populate({
    path: 'items.item',         // ⬅ add
   populate: [
     { path: 'brand',    select: 'brandName' },
     { path: 'category', select: 'name'       }
   ]
  })
  .populate("customer")
  .populate("deliveryAgent")
  .populate("AssignTo")
    .populate({
    path: 'allItems.item',
    populate: [
      { path: 'brand' },
      { path: 'category' }
    ]
  })
  // .populate("slot")
  .populate({
    path: 'unAvailableItems.item',
    populate: [
      { path: 'brand' },
      { path: 'category' }
    ]
  });
   if(!data){
     return res.status(500).json({
       message:"No Order found"
     })
   }
   return res.status(200).json({
     message:"Order fetched successfully",
     data:data
   })
 } catch (error) {
  return res.status(500).json({
    message:"Internal server error",
    error:error.message
  })
 }
}



exports.getAnyOrderById = asyncHandler(async (req,res)=>{
  const order = await Order.findById(req.params.id)
        .populate("customer","name phone email")
        .populate("items.item","itemName itemCode salesPrice itemImage");

  if (!order) return res.status(404).json({ message:"Order not found" });
  res.json({ success:true, data:order });
});




exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate input
  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if order exists
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
  if(status!=="Delivered"){
    addOrderNotification(order.customer,order.orderNumber,`Order${status}`)
  }

   

    // Handle completed orders with rider delivery
    if (status === "Delivered" && order.deliveryAgentModel === "Rider") {
      const rider = await Rider.findById(order.deliveryAgent).session(session);
      if (!rider) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Assigned rider not found",
        });
      }

      const riderAccount = await RiderAccount.findById(rider.riderAccount).session(session);
      if (!riderAccount) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Rider account not found",
        });
      }
    addOrderNotification(order.customer,order.orderNumber,"OrderDelivered")
      // Handle Cash on Delivery
      if (order.paymentMethod === "Cash on Delivery") {
        const amount = order.finalAmount;
        
        // Update rider account with transaction
        riderAccount.currentBalance += amount;
        riderAccount.totalOrderSale += amount;
        riderAccount.cashSale += amount;
        
        // Add transaction history
        rider.RiderTranscation.push({
          amount,
          type: 'Deposit',
          format:"Credited",
          transcationId:generateTransactionId
        });

        await rider.save({session});
        await riderAccount.save({ session });
      }
      else{
         const amount = order.finalAmount;
        
        // Update rider account with transaction
        riderAccount.currentBalance += amount;
        riderAccount.totalOrderSale += amount;
        riderAccount.bankSale += amount;

         rider.RiderTranscation.push({
          amount,
          type: 'Deposit',
          format:"Credited",
          transcationId:generateTransactionId
        });
       
        await rider.save({session});
        await riderAccount.save({ session });
      }
    }


    
    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deliveryTime:new Date(),
        status,
        ...(status === 'Delivered' && { deliveredAt: new Date() }),
        ...(status === 'Cancelled' && { cancelledAt: new Date() })
      },
      { new: true, runValidators: true, session }
    ).populate('deliveryAgent customer');

    await session.commitTransaction();


    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};


//delete order by id
exports.deleteById=async (req,res)=>{
  try {
    const {id}=req.params
    if(!id){
      return res.status(500).json({
        message:"id is required"
      })
    }
    const data= await Order.findByIdAndDelete(id)
    if(!data){
      return res.status(500).json({
        message:"Unable to delete"
      })
    }
    res.status(200).json({
      message:"Deleted successfully"
    })
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}


exports.assignDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;
    let { deliveryAgent, deliveryAgentModel } = req.body;
    
    if (!id) {
      return res.status(400).json({
        message: "Order ID is required"
      });
    }

    // Get the order with current delivery agent info and items
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. First, handle returning items from previous delivery agent (if any)
      if (deliveryAgent && deliveryAgentModel === "Warehouse" &&order.deliveryAgent==="") {
        console.log("AAAA")
        // Return items to previous warehouse
        for (const item of order.allItems) {
          console.log(item)
          await Item.updateOne(
            { 
              _id: item.item,
              warehouse: order.AssignTo
            },
            { 
              $inc: { openingStock: +item.quantity } 
            },
            { session }
          );
        }
      }

      if (deliveryAgent && deliveryAgentModel === "Warehouse" &&order.deliveryAgent) {
        console.log("AAAA")
        // Return items to previous warehouse
        for (const item of order.allItems) {
          console.log(item)
          await Item.updateOne(
            { 
              _id: item.item,
              warehouse: order.deliveryAgent
            },
            { 
              $inc: { openingStock: +item.quantity } 
            },
            { session }
          );
        }
      }

    

      // 2. Now assign to the new delivery agent
      if (deliveryAgentModel === "Rider") {
        const rider = await Rider.findById(deliveryAgent).session(session);
        if (!rider) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            message: "No such rider exists"
          });
        }
  for (const item of order.items) {
          console.log(item)
          await Item.updateOne(
            { 
              _id: item.item,
              warehouse: order.deliveryAgent
            },
            { 
              $inc: { openingStock: +item.quantity } 
            },
            { session }
          );
        }
          


        // 1. Get all items in the target warehouse
    const warehouseItems = await Item.find({ warehouse: order.AssignTo }).session(session);
    console.log('Warehouse Items:', warehouseItems);

    // Convert to Map with both string and ObjectId keys for reliable lookup
    const warehouseItemMap = new Map();
    warehouseItems.forEach(item => {
        warehouseItemMap.set(item._id.toString(), item); // String key
        warehouseItemMap.set(item._id, item); // ObjectId key
    });

    // 2. Prepare updated validation arrays
    const updatedAvailableItems = [];
    const updatedUnavailableItems = [];

    // Validate each item against warehouse inventory
    for (const orderItem of order.allItems) {
        // Debug: Log item comparison
        console.log('Processing order item:', orderItem);
        console.log('Item ID type:', typeof orderItem.item, orderItem.item);

        // Try both string and ObjectId lookups
        const warehouseItem = warehouseItemMap.get(orderItem.item?.toString()) || 
                            warehouseItemMap.get(orderItem.item);

        if (!warehouseItem) {
            console.log('Item not found in warehouse');
            updatedUnavailableItems.push({
                ...orderItem.toObject(), // Spread all original properties
                reason: "Item not available in this warehouse"
            });
            continue;
        }

        console.log('Warehouse item stock:', warehouseItem.openingStock);
        if (warehouseItem.openingStock < orderItem.quantity) {
            updatedUnavailableItems.push({
                ...orderItem.toObject(),
                available: warehouseItem.openingStock,
                reason: "Insufficient stock in warehouse"
            });
            continue;
        }

        updatedAvailableItems.push({
            ...orderItem.toObject(),
            itemName: orderItem.itemName || warehouseItem.itemName
        });
    }

    console.log('Available Items:', updatedAvailableItems);
    console.log('Unavailable Items:', updatedUnavailableItems);

    // 3. Update order
    const update = await Order.findByIdAndUpdate(
        id,
        {
            $set: {
                deliveryAgent: deliveryAgent,
                deliveryAgentModel: "Rider",
                items: updatedAvailableItems,
                unAvailableItems: updatedUnavailableItems
            }
        },
        { new: true, session }
    );

        if (!update) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            message: "Unable to assign warehouse"
          });
        }

        // 4. Deduct stock from warehouse items only if there are available items
        if (updatedAvailableItems.length > 0) {
          const bulkUpdateOps = updatedAvailableItems.map(item => ({
            updateOne: {
              filter: { _id: item.item, warehouse: order.AssignTo },
              update: { $inc: { openingStock: -item.quantity } }
            }
          }));

          await Item.bulkWrite(bulkUpdateOps, { session });
        }

      
      



        
        if (!update) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            message: "Unable to assign rider"
          });
        }

       await Rider.findByIdAndUpdate(
             deliveryAgent, 
              {
               status: "Inactive",
             $push: { orderId: id }
            },
  { session }
);





        
        await session.commitTransaction();
        session.endSession();
        
        return res.status(200).json({
          success: true,
          message: "Rider assigned successfully",
          data: update
        });


      }

      if (deliveryAgentModel === "Warehouse") {
        // Debug: Log initial data
    console.log('Order Items:', order.allItems);
    console.log('Warehouse ID:', deliveryAgent);

    // 1. Get all items in the target warehouse
    const warehouseItems = await Item.find({ warehouse: deliveryAgent }).session(session);
    console.log('Warehouse Items:', warehouseItems);

    // Convert to Map with both string and ObjectId keys for reliable lookup
    const warehouseItemMap = new Map();
    warehouseItems.forEach(item => {
        warehouseItemMap.set(item._id.toString(), item); // String key
        warehouseItemMap.set(item._id, item); // ObjectId key
    });

    // 2. Prepare updated validation arrays
    const updatedAvailableItems = [];
    const updatedUnavailableItems = [];

    // Validate each item against warehouse inventory
    for (const orderItem of order.allItems) {
        // Debug: Log item comparison
        console.log('Processing order item:', orderItem);
        console.log('Item ID type:', typeof orderItem.item, orderItem.item);

        // Try both string and ObjectId lookups
        const warehouseItem = warehouseItemMap.get(orderItem.item?.toString()) || 
                            warehouseItemMap.get(orderItem.item);

        if (!warehouseItem) {
            console.log('Item not found in warehouse');
            updatedUnavailableItems.push({
                ...orderItem.toObject(), // Spread all original properties
                reason: "Item not available in this warehouse"
            });
            continue;
        }

        console.log('Warehouse item stock:', warehouseItem.openingStock);
        if (warehouseItem.openingStock < orderItem.quantity) {
            updatedUnavailableItems.push({
                ...orderItem.toObject(),
                available: warehouseItem.openingStock,
                reason: "Insufficient stock in warehouse"
            });
            continue;
        }

        updatedAvailableItems.push({
            ...orderItem.toObject(),
            itemName: orderItem.itemName || warehouseItem.itemName
        });
    }

    console.log('Available Items:', updatedAvailableItems);
    console.log('Unavailable Items:', updatedUnavailableItems);

    // 3. Update order
    const update = await Order.findByIdAndUpdate(
        id,
        {
            $set: {
                deliveryAgent: deliveryAgent,
                deliveryAgentModel: "Warehouse",
                items: updatedAvailableItems,
                unAvailableItems: updatedUnavailableItems
            }
        },
        { new: true, session }
    );

        if (!update) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            message: "Unable to assign warehouse"
          });
        }

        // 4. Deduct stock from warehouse items only if there are available items
        if (updatedAvailableItems.length > 0) {
          const bulkUpdateOps = updatedAvailableItems.map(item => ({
            updateOne: {
              filter: { _id: item.item, warehouse: deliveryAgent },
              update: { $inc: { openingStock: -item.quantity } }
            }
          }));

          await Item.bulkWrite(bulkUpdateOps, { session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: "Warehouse assigned and inventory updated successfully",
          data: update
        });
      }

      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid delivery agent model"
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


exports.giveRating=async(req,res)=>{
  try {
        const id=req.params.orderid
        const{customerId,description,likes}=req.body
        if(!customerId){
          return res.status(400).json({
            message:"Customer id is required"
          })
        }
        const orderExist=await Order.findById(id)
        if(!orderExist){
          return res.status(400).json({
            message:"No such order exist"
          })
        }
        const rating=[...orderExist.orderRating  ,{
          description:description,
          customerId:customerId,
          likes:likes
        }]
        const updateOrder=await Order.findByIdAndUpdate(id,{
          orderRating:rating
        })
        return res.status(200).json({
          success:true,
          message:"Review submitted successfully",
          data:updateOrder
        })
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}