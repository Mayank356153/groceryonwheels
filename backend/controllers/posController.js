const PosOrder = require("../models/PosOrder");
const Warehouse = require("../models/warehouseModel");
const Customer = require("../models/customerDataModel");
const Item = require("../models/itemModel");
const PaymentType = require("../models/paymentTypeModel");
const DiscountCoupon = require("../models/discountCouponModel");
const { recordSale } = require("../services/recordSale");
const { updateInventory } = require('../helpers/inventory');
const Ledger    = require("../models/ledgerModel");
const VanBooking = require('../models/bookingModel');
const CustomerOnline = require("../models/customerModel");
const RawLot = require("../models/rawLotModel");



// Generate a unique payment code if none was provided
function generatePaymentCode(prefix = "PMT/2025/") {
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit
  return `${prefix}${randomNum}`;
}

exports.createOrder = async (req, res) => {
  try {
    let {
      warehouse,
      customer,
      customerModel = "CustomerData",
      booking: bookingId,
      bookingId: _legacyBookingId,
      items,
      totalAmount,
      totalDiscount = 0,
      payments,
      status,
      invoiceCount,
      previousBalance,
      additionalCharges,
      couponCode,
      adjustAdvancePayment,
      advancePaymentAmount,
      account,
      location,additionalPayment
    } = req.body;
     console.log(req.body);
    // 1) Basic validation
    if (!warehouse || !customer || !items?.length || totalAmount == null || !payments?.length) {
      console.log("Validation failed:", { warehouse, customer, items, totalAmount, payments });
      return res.status(400).json({ message: "Missing required!" });
    }

    if (bookingId) {
      const booking = await VanBooking.findById(bookingId).lean();
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      customer = booking.customer;
      customerModel = "Customer";
    }
    const CustomerModel = customerModel === "Customer" ? CustomerOnline : Customer;

    // 2) Fetch warehouse & customer
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id cashAccount"),
      CustomerModel.findById(customer),
    ]);

    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found!" });
    if (!customerDoc) return res.status(404).json({ message: "Customer not found!" });

    // 3) Coupon validation
    if (couponCode) {
      const cpn = await DiscountCoupon.findOne({ couponCode, status: "Active" });
      if (!cpn) return res.status(400).json({ message: "Invalid coupon code!" });
      if (new Date(cpn.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Coupon expired!" });
      }
      const disc = cpn.couponType === "percentage" ? (totalAmount * cpn.value) / 100 : cpn.value;
      totalDiscount += disc;
      totalAmount -= disc;
    }

    // 4) Advance payment
    if (adjustAdvancePayment && advancePaymentAmount) {
      if (customerDoc.advanceBalance < advancePaymentAmount) {
        return res.status(400).json({ message: "Insufficient advance balance" });
      }
      customerDoc.advanceBalance -= advancePaymentAmount;
      await customerDoc.save();
      totalAmount -= advancePaymentAmount;
    }

    // 5) Payments validation & code generation
    let paid = 0;
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found!" });
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      }
      if (!p.paymentCode) {
        p.paymentCode = generatePaymentCode();
      }
      paid += p.amount;
    }

    // 6) Build validItems array and handle stock deduction
    const validItems = [];
    for (const row of items) {
      let itemDoc, variantId = null, rawLotDoc;

      // Handle packed lots
      if (row.rawLot) {
        rawLotDoc = await RawLot.findById(row.rawLot).populate("item", "itemName itemCode");
        if (!rawLotDoc || !rawLotDoc.packSize) {
          return res.status(404).json({ message: `Packed lot not found: ${row.rawLot}` });
        }

        // Validate stock for packed lot
        const packsMade = Math.floor(rawLotDoc.packedQty / rawLotDoc.packSize);
        const packsLeft = rawLotDoc.totalPacksMade || packsMade;
        if (row.quantity > packsLeft) {
          return res.status(400).json({ message: `Not enough stock for packed lot ${row.rawLot}` });
        }

        // Deduct stock for packed lot
        const bulkToDeduct = row.quantity * rawLotDoc.packSize;
        rawLotDoc.packedQty -= bulkToDeduct;
        if (rawLotDoc.packedQty < rawLotDoc.bulkQty) rawLotDoc.isPacked = false;
        await rawLotDoc.save();

        validItems.push({
          rawLot: row.rawLot, // Store rawLot for packed lots
          item: rawLotDoc.item._id, // Store parent item ID for reference
          quantity: row.quantity,
          price: row.price,
          discount: row.discount || 0,
          tax: row.tax || null,
          subtotal: row.subtotal,
          packSize: rawLotDoc.packSize, // Include packSize for reference
        });
      } else {
        // Handle regular items
        itemDoc = await Item.findById(row.item);
        if (!itemDoc) {
          return res.status(404).json({ message: `Item not found: ${row.item}` });
        }

        // If it's a variant, ensure it exists
        if (itemDoc.itemGroup === "Variant") {
          if (!row.variant) {
            return res.status(400).json({
              message: `Variant ID required for item ${itemDoc.itemName}`,
            });
          }
          const variant = itemDoc.variants.id(row.variant);
          if (!variant) {
            return res.status(404).json({
              message: `Variant ${row.variant} not found in item ${row.item}`,
            });
          }
          variantId = variant._id;
        }

        validItems.push({
          item: itemDoc._id,
          variant: variantId,
          quantity: row.quantity,
          price: row.price,
          discount: row.discount || 0,
          tax: row.tax || null,
          subtotal: row.subtotal,
        });
      }
    }

    // 7) Compute balanceDue / changeReturn / isPaid
    const balanceDue = paid < totalAmount ? totalAmount - paid : 0;
    const changeReturn = paid > totalAmount ? paid - totalAmount : 0;
    const isPaid = balanceDue === 0;

    // 8) Persist the PosOrder
    const order = await PosOrder.create({
      createdBy: req.user._id || req.user.id,
      createdByModel: req.user.role.toLowerCase() === "admin" ? "Admin" : "User",
      warehouse,
      location: location || [],
      customer,
      customerModel,
      booking: bookingId,
      account,
      additionalCharges,
      additionalPayment,
      items: validItems,
      totalAmount,
      totalDiscount,
      payments,
      status: status || "Pending",
      invoiceCount,
      previousBalance,
      couponCode,
      balanceDue,
      changeReturn,
      advanceUsed: adjustAdvancePayment ? advancePaymentAmount : 0,
      isPaid,
    });

    // 9) Update inventory for regular items
    for (const row of validItems) {
      if (!row.rawLot) {
        const inventoryItemId = row.variant ?? row.item;
        await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
      }
    }

    // 10) Record sale in payments ledger
    await recordSale({
      warehouseId: warehouse,
      payments: order.payments,
      referenceId: order._id,
      refModel: "PosOrder",
    });

    return res.status(201).json({
      message: "Order created successfully!",
      order,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/posController.js
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      warehouse,
      customer,
      items,
      totalAmount,
      totalDiscount = 0,
      payments = [],
      status,
      invoiceCount,
      previousBalance,
      couponCode,
      adjustAdvancePayment,
      advancePaymentAmount,
      account,
    } = req.body;

    // 1) Basic validation
    if (!warehouse || !customer || !items?.length || totalAmount == null || !payments.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // 2) Fetch existing order to roll back its inventory
    const existing = await PosOrder.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Order not found" });

    // 3) Roll back inventory for old items
    for (const oldRow of existing.items) {
      if (oldRow.rawLot) {
        const rawLotDoc = await RawLot.findById(oldRow.rawLot);
        if (rawLotDoc) {
          rawLotDoc.packedQty += oldRow.quantity * rawLotDoc.packSize;
          if (rawLotDoc.packedQty >= rawLotDoc.bulkQty) rawLotDoc.isPacked = true;
          await rawLotDoc.save();
        }
      } else {
        const inventoryItemId = oldRow.variant ?? oldRow.item;
        await updateInventory(existing.warehouse, inventoryItemId, Number(oldRow.quantity));
      }
    }

    // 4) Fetch & validate warehouse + customer
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id"),
      Customer.findById(customer),
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found" });
    if (!customerDoc) return res.status(404).json({ message: "Customer not found" });

    // 5) Coupon & advance-payment adjustments
    let newTotalAmount = totalAmount;
    let newTotalDiscount = totalDiscount;
    if (couponCode) {
      const cpn = await DiscountCoupon.findOne({ couponCode, status: "Active" });
      if (!cpn) return res.status(400).json({ message: "Invalid coupon code" });
      if (new Date(cpn.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }
      const disc = cpn.couponType === "percentage" ? (newTotalAmount * cpn.value) / 100 : cpn.value;
      newTotalDiscount += disc;
      newTotalAmount -= disc;
    }
    if (adjustAdvancePayment && advancePaymentAmount) {
      if (customerDoc.advanceBalance < advancePaymentAmount) {
        return res.status(400).json({ message: "Insufficient advance balance" });
      }
      customerDoc.advanceBalance -= advancePaymentAmount;
      await customerDoc.save();
      newTotalAmount -= advancePaymentAmount;
    }

    // 6) Normalize payments so they sum to newTotalAmount
    const sumPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (sumPaid !== newTotalAmount) {
      if (payments.length === 1) {
        payments[0].amount = newTotalAmount;
      } else {
        payments.forEach(p => {
          const ratio = (p.amount || 0) / (sumPaid || 1);
          p.amount = Math.round(ratio * newTotalAmount * 100) / 100;
        });
      }
    }

    // 7) Payment-type validation & code gen, preserve paymentDate
    let paid = 0;
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found" });
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      }
      if (!p.paymentCode) {
        p.paymentCode = generatePaymentCode();
      }
      // Preserve or set paymentDate to createdAt if not provided
      if (!p.hasOwnProperty('paymentDate')) {
        p.paymentDate = existing.createdAt; // Use original createdAt
      }
      paid += p.amount;
    }

    // 8) Build new validItems and handle stock deduction
    const validItems = [];
    for (const row of items) {
      let itemDoc, variantId = null, rawLotDoc;

      if (row.rawLot) {
        rawLotDoc = await RawLot.findById(row.rawLot).populate("item", "itemName itemCode");
        if (!rawLotDoc || !rawLotDoc.packSize) {
          return res.status(404).json({ message: `Packed lot not found: ${row.rawLot}` });
        }
        const packsMade = Math.floor(rawLotDoc.packedQty / rawLotDoc.packSize);
        const packsLeft = rawLotDoc.totalPacksMade || packsMade;
        if (row.quantity > packsLeft) {
          return res.status(404).json({ message: `Not enough stock for packed lot ${row.rawLot}` });
        }
        const bulkToDeduct = row.quantity * rawLotDoc.packSize;
        rawLotDoc.packedQty -= bulkToDeduct;
        if (rawLotDoc.packedQty < rawLotDoc.bulkQty) rawLotDoc.isPacked = false;
        await rawLotDoc.save();

        validItems.push({
          rawLot: row.rawLot,
          item: rawLotDoc.item._id,
          quantity: row.quantity,
          price: row.price,
          discount: row.discount || 0,
          tax: row.tax || null,
          subtotal: row.subtotal,
          packSize: rawLotDoc.packSize,
        });
      } else {
        itemDoc = await Item.findById(row.item);
        if (!itemDoc) {
          return res.status(404).json({ message: `Item not found: ${row.item}` });
        }
        if (itemDoc.itemGroup === "Variant") {
          if (!row.variant) {
            return res.status(400).json({ message: `Variant ID required for ${itemDoc.itemName}` });
          }
          const variant = itemDoc.variants.id(row.variant);
          if (!variant) {
            return res.status(404).json({ message: `Variant not found: ${row.variant}` });
          }
          variantId = variant._id;
        }
        validItems.push({
          item: itemDoc._id,
          variant: variantId,
          quantity: row.quantity,
          price: row.price,
          discount: row.discount || 0,
          tax: row.tax || null,
          subtotal: row.subtotal,
        });
      }
    }

    // 9) Compute balanceDue / changeReturn / isPaid
    const balanceDue = paid < newTotalAmount ? newTotalAmount - paid : 0;
    const changeReturn = paid > newTotalAmount ? paid - newTotalAmount : 0; // Fixed calculation
    const isPaid = balanceDue === 0;

    // 10) Persist the updated order
    const updated = await PosOrder.findByIdAndUpdate(
      id,
      {
        warehouse,
        customer,
        account,
        items: validItems,
        totalAmount: newTotalAmount,
        totalDiscount: newTotalDiscount,
        payments,
        status: status || "Pending",
        invoiceCount,
        previousBalance,
        couponCode,
        balanceDue,
        changeReturn,
        advanceUsed: adjustAdvancePayment ? advancePaymentAmount : 0,
        isPaid,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 11) Apply new inventory deductions for regular items
    for (const row of validItems) {
      if (!row.rawLot) {
        const inventoryItemId = row.variant ?? row.item;
        await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
      }
    }

    // 12) Rewrite the payment ledger with preserved dates
    await recordSale({
      warehouseId: warehouse,
      payments: updated.payments,
      referenceId: updated._id,
      refModel: "PosOrder",
    });

    return res.json({ message: "Order updated successfully!", order: updated });
  } catch (err) {
    console.error("updateOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // Assuming req.user is set by authentication middleware
    const { status } = req.query; // Extract status query parameter

    // Build the query filter
    const filter = {
      createdBy: userId, // Restrict to orders created by the authenticated user
    };

    // Add status filter if provided
    if (status) {
      filter.status = status; // e.g., "OnHold"
    }

    // Add warehouse filter if user has a specific warehouse
    if (req.user.warehouse) {
      filter.warehouse = req.user.warehouse;
    }

    const orders = await PosOrder.find(filter)
      .populate("warehouse", "name _id")
      .populate("customer", "name _id")
      .populate("payments.paymentType", "paymentTypeName")
      .populate({ path: "items.item", select: "itemName itemCode" })
      .lean(); // Use lean for performance

    res.status(200).json(orders);
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await PosOrder.findById(req.params.id)
      .populate("warehouse customer")
      .populate("payments.paymentType", "paymentTypeName")
      .populate({ path: "items.item" });
    if (!order) return res.status(404).json({ message: "Order not found!" });
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await PosOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found!" });
    }

    // 1) Roll back stock
    await Promise.all(order.items.map(row => {
      const inventoryItemId = row.variant ?? row.item;
      // add back the previously subtracted quantity
      return updateInventory(order.warehouse, inventoryItemId, Number(row.quantity));
    }));

    // 2) Remove any CASH_SALE or BANK_SALE ledger entries for this order
    await Ledger.deleteMany({
      warehouse:   order.warehouse,
      referenceId: order._id,
      refModel:    "PosOrder",
      type:        { $in: ["CASH_SALE","BANK_SALE"] }
    });

    // 3) Finally delete the order
    await PosOrder.findByIdAndDelete(order._id);

    return res.status(200).json({ message: "Order deleted and rollback completed." });
  }
  catch (err) {
    console.error("deleteOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/pos.js
exports.updateOrderPaymentType = async (req, res) => {
  try {
    const { paymentType } = req.body;
    if (!paymentType) {
      return res.status(400).json({ message: "paymentType is required" });
    }

    const order = await PosOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.payments.length) {
      return res.status(400).json({ message: "No payments to update" });
    }

    order.payments[0].paymentType = paymentType;
    order.payments[0].paymentDate = order.createdAt; // Always set

    await order.save();
    await recordSale({
      warehouseId: order.warehouse,
      payments: order.payments,
      referenceId: order._id,
      refModel: "PosOrder",
    });

    return res.json({ success: true, order });
  } catch (err) {
    console.error("updateOrderPaymentType error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};