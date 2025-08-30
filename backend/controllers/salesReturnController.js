const mongoose = require("mongoose");
const SalesReturn = require("../models/SalesReturn");
const Sales = require("../models/Sales");
const PosOrder = require("../models/PosOrder");
const Warehouse = require("../models/warehouseModel");
const CustomerData = require("../models/customerDataModel");
const Item = require("../models/itemModel");
const PaymentType = require("../models/paymentTypeModel");
const Account = require("../models/accountModel");
const { updateInventory } = require("../helpers/inventory");
const { recordSale } = require("../services/recordSale");

exports.createReturn = async (req, res) => {
  try {
    const {
      originalSaleRef,
      returnCode,
      referenceNo,
      returnDate,
      warehouse,
      customer,
      items,
      totalRefund,
      status,
      note,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnAll,
      payments
    } = req.body;

    // Validate required fields
    if (!returnCode || !warehouse || !customer || !items?.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Initialize saleDoc and saleModel
    let saleDoc = null;
    let saleModel = null;

    // If originalSaleRef is provided, find the original sale
    if (originalSaleRef) {
      saleDoc =
        (await Sales.findOne({ referenceNo: originalSaleRef })) ||
        (await PosOrder.findOne({ saleCode: originalSaleRef }));
      if (!saleDoc) {
        return res.status(404).json({
          message: `No sale or POS order found: ${originalSaleRef}`
        });
      }
      saleModel = saleDoc instanceof Sales ? 'Sales' : 'PosOrder';
    }

    // Validate warehouse and customer
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse),
      CustomerData.findById(customer)
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found!" });
    if (!customerDoc) return res.status(404).json({ message: "Customer not found!" });

    // Normalize items
    const validItems = [];
    for (const it of items) {
      let parentItem, variantId = null;

      parentItem = await Item.findById(it.item);
      if (!parentItem) {
        const parent = await Item.findOne(
          { "variants._id": it.item },
          { "variants.$": 1 }
        );
        if (!parent) {
          return res.status(404).json({
            message: `No item or variant found: ${it.item}`
          });
        }
        parentItem = parent;
        variantId = it.item;
      }

      validItems.push({
        item: parentItem._id,
        variant: variantId,
        quantity: it.quantity,
        reason: it.reason || ""
      });
    }

    // Update inventory ledger (add back)
    for (const row of validItems) {
      const invId = row.variant ?? row.item;
      await updateInventory(warehouse, invId, Number(row.quantity));
    }

    // Normalize payments
    const validPayments = [];
    for (const p of payments || []) {
      if (p.paymentType) {
        const exists = await PaymentType.findById(p.paymentType);
        if (!exists) return res.status(404).json({
          message: `PaymentType not found: ${p.paymentType}`
        });
      }
      if (p.account) {
        const exists = await Account.findById(p.account);
        if (!exists) return res.status(404).json({
          message: `Account not found: ${p.account}`
        });
      }
      validPayments.push({
        paymentType: p.paymentType || null,
        account: p.account || null,
        amount: p.amount || 0,
        paymentNote: p.paymentNote || "",
        paymentDate: p.paymentDate || Date.now()
      });
    }

    // Debug: Log the SalesReturn payload
    const returnPayload = {
      sale: saleDoc ? saleDoc._id : null,
      saleModel: saleModel,
      returnCode,
      referenceNo: referenceNo || "",
      returnDate: returnDate || new Date(),
      warehouse: warehouseDoc._id,
      customer: customerDoc._id,
      items: validItems,
      totalRefund: totalRefund || 0,
      status: status || "Return",
      note,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnAll,
      payments: validPayments,
      createdBy: req.user?.id || null,
      createdByModel: req.user
        ? (req.user.role.toLowerCase() === "admin" ? "Admin" : "User")
        : null
    };
    console.log('SalesReturn payload:', returnPayload);

    // Create return record
    const newReturn = await SalesReturn.create(returnPayload);

    // Negate payment amounts for recordSale
    const negativePayments = validPayments.map(p => ({
      ...p,
      amount: -(p.amount || 0)
    }));

    // Record sale in Ledger
    await recordSale({
      warehouseId: warehouseDoc._id,
      payments: negativePayments,
      referenceId: newReturn._id,
      refModel: saleModel || 'PosOrder' // Default to 'Sales' if no saleModel
    });

    return res
      .status(201)
      .json({ message: "Return created successfully!", return: newReturn });
  } catch (err) {
    console.error("createReturn error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
  

exports.getAllReturns = async (_req, res) => {
  try {
    const returns = await SalesReturn.find()
      .populate({ path:"sale", select:"saleCode invoiceCode grandTotal" })
      .populate("warehouse customer items.item")
      .populate("payments.paymentType payments.account")
      .populate("createdBy", "name FirstName LastName");

    const totalCount = await SalesReturn.countDocuments();
    const totalRefunded = await SalesReturn.aggregate([
      { $group:{ _id:null, total:{ $sum:"$totalRefund" } } }
    ]).then(a => a[0]?.total || 0);

    const processed = returns.map(doc => {
      const c = doc.createdBy;
      const creatorName =
        doc.createdByModel === "Admin" ? c?.name
        : c ? `${c.FirstName||""} ${c.LastName||""}`.trim()
        : "";
      return { ...doc.toObject(), creatorName };
    });

    res.status(200).json({ summary:{ totalCount, totalRefunded }, returns:processed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:"Internal server error" });
  }
};

/* ───────────────────────────────────────────────────────────
   GET ONE
───────────────────────────────────────────────────────────*/
exports.getReturnById = async (req, res) => {
  try {
    const doc = await SalesReturn.findById(req.params.id)
      .populate({ path:"sale", select:"saleCode invoiceCode grandTotal" })
      .populate("warehouse customer items.item")
      .populate("payments.paymentType payments.account")
      .populate("createdBy", "name FirstName LastName");
    if (!doc) return res.status(404).json({ message:"Return not found!" });

    const c = doc.createdBy;
    const creatorName =
      doc.createdByModel === "Admin" ? c?.name
      : c ? `${c.FirstName||""} ${c.LastName||""}`.trim()
      : "";

    res.status(200).json({ ...doc.toObject(), creatorName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:"Internal server error" });
  }
};

/* ───────────────────────────────────────────────────────────
   UPDATE
───────────────────────────────────────────────────────────*/
exports.updateReturn = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch existing return and roll back its inventory
    const existing = await SalesReturn.findById(id).lean();
    if (!existing) {
      return res.status(404).json({ message: "Return not found!" });
    }
    for (const oldRow of existing.items) {
      const invId = oldRow.variant ?? oldRow.item;
      // subtract the old returned quantity
      await updateInventory(existing.warehouse, invId, -Number(oldRow.quantity));
    }

    // 2️⃣ Destructure all updatable fields from the request
    const {
      returnCode,
      referenceNo,
      returnDate,
      warehouse,
      customer,
      items,
      totalRefund,
      status,
      note,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnAll,
      payments
    } = req.body;

    // 3️⃣ Validate required fields
    if (!warehouse || !customer || !items?.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // 4️⃣ Validate warehouse & customer exist
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse),
      CustomerData.findById(customer)
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found!" });
    if (!customerDoc) return res.status(404).json({ message: "Customer not found!" });

    // 5️⃣ Normalize incoming items → validItems[]
    const validItems = [];
    for (const it of items) {
      let parentItem, variantId = null;

      // Try loading as top‐level item
      parentItem = await Item.findById(it.item);
      // If not found, maybe it's a variant?
      if (!parentItem) {
        const parent = await Item.findOne(
          { "variants._id": it.item },
          { "variants.$": 1 }
        );
        if (!parent) {
          return res.status(404).json({
            message: `No item or variant found with id ${it.item}`
          });
        }
        parentItem = parent;
        variantId  = it.item;
      }

      validItems.push({
        item:     parentItem._id,
        variant:  variantId,
        quantity: it.quantity,
        reason:   it.reason || ""
      });
    }

    // 6️⃣ Apply the new return quantities back into inventory
    for (const row of validItems) {
      const invId = row.variant ?? row.item;
      await updateInventory(warehouse, invId, Number(row.quantity));
    }

    // 7️⃣ Normalize payments with validation
    const validPayments = [];
    for (const p of payments || []) {
      if (p.paymentType) {
        const exists = await PaymentType.findById(p.paymentType);
        if (!exists) {
          return res.status(404).json({ message: `PaymentType not found: ${p.paymentType}` });
        }
      }
      if (p.account) {
        const exists = await Account.findById(p.account);
        if (!exists) {
          return res.status(404).json({ message: `Account not found: ${p.account}` });
        }
      }
      validPayments.push({
        paymentType : p.paymentType || null,
        account     : p.account     || null,
        amount      : p.amount      || 0,
        paymentNote : p.paymentNote || "",
        paymentDate : p.paymentDate || Date.now()
      });
    }

    // 8️⃣ Persist the updated return document
    const updated = await SalesReturn.findByIdAndUpdate(
      id,
      {
        returnCode,
        referenceNo,
        returnDate,
        warehouse,
        customer,
        items:              validItems,
        totalRefund,
        status,
        note,
        otherCharges,
        discountCouponCode,
        couponType,
        couponValue,
        discountOnAll,
        payments:           validPayments,
      },
      { new: true }
    )
    .populate({ path: "sale", select: "saleCode referenceNo totalRefund" })
    .populate("warehouse customer items.item")
    .populate("payments.paymentType payments.account")
    .populate("createdBy", "name FirstName LastName");

    if (!updated) {
      return res.status(404).json({ message: "Return not found!" });
    }

    // 9️⃣ Compute creatorName for response
    const c = updated.createdBy;
    const creatorName =
      updated.createdByModel === "Admin" ? c?.name :
      c ? `${c.FirstName || ""} ${c.LastName || ""}`.trim() : "";

    return res.status(200).json({
      message: "Return updated successfully!",
      return: { ...updated.toObject(), creatorName }
    });
  } catch (err) {
    console.error("updateReturn error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ───────────────────────────────────────────────────────────
   DELETE
───────────────────────────────────────────────────────────*/
exports.deleteReturn = async (req, res) => {
  try {
    const deleted = await SalesReturn.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message:"Return not found" });
    res.status(200).json({ message:"Return deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:"Internal server error" });
  }
};
