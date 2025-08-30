// controllers/purchaseController.js

const Purchase = require("../models/purchaseModel");
const Warehouse = require("../models/warehouseModel");
const Supplier = require("../models/supplierModel");
const PaymentType = require("../models/paymentTypeModel");
const Item = require("../models/itemModel");
const { updateInventory } = require("../helpers/inventory");
const { recordSale }     = require("../services/recordSale");
const Ledger = require("../models/ledgerModel");
const RawLot = require("../models/rawLotModel");
// ── add at top (with your other requires) ──
const { parse } = require("csv-parse/sync");    // npm i csv-parse

// ── POST /purchases/bulk ──
exports.bulkPurchase = async (req, res) => {
  try {
    const { warehouse, supplier } = req.body;
    if (!warehouse || !supplier) {
      return res.status(400).json({ success:false, message:"warehouse & supplier required" });
    }
    if (!req.user?.id) {
      return res.status(400).json({ success:false, message:"User ID not found in request" });
    }

    /* ① parse CSV */
    const rows = parse(
      req.file.buffer.toString("utf8"),
      { columns: true, trim: true, skip_empty_lines: true }
    );
    if (!rows.length) throw new Error("CSV is empty");

    /* ② build purchase lines with debug */
    const items = [];
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (!r.itemCode || !r.quantity) {
        throw new Error(`itemCode & quantity required on row ${idx + 1}`);
      }

      const itemDoc = await Item.findOne({
        $or: [{ itemCode: r.itemCode }, { barcodes: r.itemCode }]
      });
      if (!itemDoc) throw new Error(`Item ${r.itemCode} not found`);

      const quantity = +r.quantity;
      const supplied = r.price?.trim();                    // e.g. "45.65" or ""
      const fallback = itemDoc.purchasePrice ?? 0;         // DB value or 0
      const rawPrice = supplied ? +supplied : fallback;    // final number

      console.log(
        `CSV row ${idx+1}: itemCode=${r.itemCode}, ` +
        `r.price=${JSON.stringify(r.price)}, fallback=${fallback}, ` +
        `rawPrice=${rawPrice}`
      );

      items.push({
        item         : itemDoc.parentItemId ? itemDoc.parentItemId : itemDoc._id,
        variant      : itemDoc.parentItemId ? itemDoc._id          : null,
        quantity,
        purchasePrice: rawPrice,
        mrp          : itemDoc.mrp,
        salesPrice   : itemDoc.salesPrice ?? 0,
        discount     : 0,
        totalAmount  : quantity * rawPrice
      });
    }

    /* ③ write one Purchase doc (no payments) */
    const bulkDoc = await Purchase.create({
      warehouse,
      supplier,
      referenceNo    : `BULK/${Date.now()}`,
      purchaseDate   : new Date(),
      items,
      grandTotal     : items.reduce((sum, line) => sum + line.totalAmount, 0),
      payments       : [],
      otherCharges   : 0,
      discountOnAll  : 0,
      createdBy      : req.user.id,
      createdByModel : req.user.role.toLowerCase() === "admin" ? "Admin" : "User"
    });

    /* ④ sequentially update inventory with debug */
    for (const line of items) {
      const id = line.variant || line.item;
      console.log(`Updating inventory for item ID ${id}: +${line.quantity}`);
      await updateInventory(warehouse, id, line.quantity);
    }

    return res.status(201).json({ success:true, data: bulkDoc });
  } catch (err) {
    console.error("bulkPurchase error:", err);
    res.status(400).json({ success:false, message: err.message });
  }
};


exports.createPurchase = async (req, res) => {
  try {
    const {
      warehouse,
      supplier,
      referenceNo,
      items = [],
      purchaseDate,
      grandTotal,
      payments = [],
      otherCharges = 0,
      discountOnAll = 0,
      note = "",
    } = req.body;

    /* 1️⃣ Basic validations */
    if (!warehouse || !supplier || !purchaseDate || !grandTotal || !items.length) {
      return res.status(400).json({ success: false, message: "Missing required fields or items are empty" });
    }
    if (!req.user?.id) {
      return res.status(400).json({ success: false, message: "User ID not found in request" });
    }

    /* 2️⃣ Validate / sanitise every line and update Item model for non-raw items */
    const sanitizedItems = [];

    for (const row of items) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc) return res.status(404).json({ success: false, message: `Item not found: ${row.item}` });

      if (itemDoc.itemGroup === "Variant") {
        if (!row.variant) {
          return res.status(400).json({ success: false, message: `Variant ID required for item ${row.item}` });
        }
        const variant = itemDoc.variants.id(row.variant);
        if (!variant) {
          return res.status(404).json({ success: false, message: `Variant ${row.variant} not found in item ${row.item}` });
        }
        // Update variant's purchasePrice and salesPrice only for non-raw items
        if (!row.isRaw) {
          await Item.findByIdAndUpdate(
            row.item,
            {
              $set: {
                "variants.$[v].purchasePrice": row.purchasePrice || row.unitCost || 0,
                "variants.$[v].salesPrice": row.salesPrice || 0,
              },
            },
            { arrayFilters: [{ "v._id": row.variant }], new: true }
          );
        }
      } else {
        // Update single item's purchasePrice and salesPrice only for non-raw items
        if (!row.isRaw) {
          await Item.findByIdAndUpdate(row.item, {
            $set: {
              purchasePrice: row.purchasePrice || row.unitCost || 0,
              salesPrice: row.salesPrice || 0,
            },
          });
        }
      }

      /* raw-lot validation */
      if (row.isRaw) {
        if (!row.bulkQty || !row.bulkCost) {
          return res.status(400).json({ success: false, message: "bulkQty and bulkCost are required when isRaw=true" });
        }
      }

      const purchasePrice = row.purchasePrice != null
        ? row.purchasePrice
        : (row.unitCost != null ? row.unitCost : 0);

      if (purchasePrice < 0) {
        return res.status(400).json({ success: false, message: `Invalid purchasePrice for item ${row.item}` });
      }

      sanitizedItems.push({
        item: itemDoc._id,
        variant: row.variant || null,
        quantity: row.isRaw ? 0 : (row.quantity || 1),
        purchasePrice,
        mrp: row.mrp || 0,
        salesPrice: row.salesPrice || 0,
        discount: row.discount || 0,
        totalAmount: row.totalAmount || 0,
        expiryDate: row.expiryDate || null,
        isRaw: !!row.isRaw,
        bulkQty: row.bulkQty || null,
        bulkUnit: row.bulkUnit || null,
        bulkCost: row.bulkCost || null,
      });
    }

    /* 3️⃣ Build purchase doc */
    const purchaseData = {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal,
      items: sanitizedItems,
      createdBy: req.user.id,
      createdByModel: req.user.role.toLowerCase() === "admin" ? "Admin" : "User",
      isReturn: false,
      status: "Normal",
      otherCharges,
      discountOnAll,
      note,
      payments,
    };

    /* 4️⃣ Save */
    const newPurchase = await Purchase.create(purchaseData);

    /* 5️⃣ Create RawLot docs (if any) */
    const rawDocs = [];
    newPurchase.items.forEach(line => {
      if (!line.isRaw) return;
      rawDocs.push({
        purchaseId: newPurchase._id,
        purchaseItem: line._id,
        item: line.item,
        warehouse: newPurchase.warehouse,
        bulkQty: line.bulkQty,
        bulkUnit: line.bulkUnit || "kg",
        bulkCost: line.bulkCost,
      });
    });
    if (rawDocs.length) await RawLot.insertMany(rawDocs);

    /* 6️⃣ Supplier “Hold” due logic */
    {
      const holdTypes = await PaymentType.find({
        paymentTypeName: { $regex: /^hold$/i },
      }).select("_id");
      const holdIds = new Set(holdTypes.map(t => t._id.toString()));
      const holdAmt = payments.reduce(
        (sum, p) => holdIds.has((p.paymentType || "").toString())
          ? sum + Number(p.amount || 0)
          : sum,
        0
      );
      if (holdAmt > 0) {
        await Supplier.findByIdAndUpdate(
          supplier,
          { $inc: { purchaseDue: holdAmt } },
          { new: false }
        );
      }
    }

    /* 7️⃣ Inventory update (quantity only) */
    for (const row of sanitizedItems) {
      if (!row.isRaw) {
        const invId = row.variant || row.item;
        await updateInventory(warehouse, invId, Number(row.quantity));
      }
    }

    /* 8️⃣ Ledger entry */
    const negativePayments = payments.map(p => ({ ...p, amount: -(p.amount || 0) }));
    await recordSale({
      warehouseId: warehouse,
      payments: negativePayments,
      referenceId: newPurchase._id,
      refModel: "Purchase",
    });

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: newPurchase,
    });
  } catch (err) {
    console.error("Error creating purchase:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2) Create a Purchase Return or Cancel
exports.createPurchaseReturn = async (req, res) => {
  try {
    
    const {
      originalPurchaseRef,
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      status,
      items: rows,
      otherCharges       = 0,
      discountCouponCode = "",
      couponType         = "",
      couponValue        = 0,
      discountOnAll      = 0,
      note               = "",
      payments           = []               // can be empty
    } = req.body;

    if (
      !warehouse || !supplier || !referenceNo ||
      !purchaseDate || !status    || !rows?.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or items are empty"
      });
    }
    if (!req.user?.id) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request"
      });
    }

   
    if (originalPurchaseRef) {
      const original = await Purchase.findOne({
        referenceNo: originalPurchaseRef,
        supplier,
        warehouse,
        isReturn: false,
        status:    "Normal"
      });
      if (!original) {
        return res.status(404).json({
          success: false,
          message: "Original purchase not found / does not match"
        });
      }
    }

   
    const validItems = [];

    for (const row of rows) {
      const { item: parentId, variant, quantity = 0,
              reason = "", purchasePrice, salesPrice } = row;

      if (purchasePrice == null || salesPrice == null) {
        return res.status(400).json({
          success: false,
          message: "Each returned item must include purchasePrice & salesPrice"
        });
      }

      const parent = await Item.findById(parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: `Item not found: ${parentId}`
        });
      }

      if (variant) {
        const v = parent.variants.id(variant);
        if (!v) {
          return res.status(404).json({
            success: false,
            message: `Variant ${variant} not found in item ${parentId}`
          });
        }
        validItems.push({
          item:        parent._id,
          variant:     v._id,
          quantity,
          reason,
          purchasePrice,
          salesPrice,
          totalAmount: purchasePrice * quantity,
          expiryDate:  row.expiryDate || null
        });
      } else {
        validItems.push({
          item:        parent._id,
          variant:     null,
          quantity,
          reason,
          purchasePrice,
          salesPrice,
          totalAmount: purchasePrice * quantity,
          expiryDate:  row.expiryDate || null
        });
      }
    }

    
    const grandTotal =
      validItems.reduce((sum, i) => sum + i.totalAmount, 0) +
      Number(otherCharges) - Number(discountOnAll);

    const returnDoc = new Purchase({
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      status,
      isReturn: true,
      items: validItems,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnAll,
      note,
      payments,
      grandTotal,
      createdBy:      req.user.id,
      createdByModel: req.user.role.toLowerCase() === "admin" ? "Admin" : "User"
    });

    await returnDoc.save();

    
    for (const row of validItems) {
      const inventoryItemId = row.variant || row.item;
      await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
    }

 
    // 6-a) find all "Hold" paymentType IDs once
    const holdTypes = await PaymentType.find({
      paymentTypeName: { $regex: /^hold$/i }
    }).select("_id");
    const holdIds = new Set(holdTypes.map(t => t._id.toString()));

    // 6-b) total hold amount on this return
    const holdAmt = payments.reduce(
      (sum, p) =>
        holdIds.has((p.paymentType || "").toString())
          ? sum + Number(p.amount || 0)
          : sum,
      0
    );

    if (holdAmt > 0) {
      //  -> OPTION A: keep separate credit column
      await Supplier.findByIdAndUpdate(
        supplier,
        { $inc: { purchaseReturnDue: holdAmt } },
        { new: false }
      );

      
    }

    await recordSale({
      warehouseId: warehouse,
      payments,                  // already positive – OK for return
      referenceId: returnDoc._id,
      refModel:   "Purchase"
    });

    
    return res.status(201).json({
      success: true,
      message: status === "Return"
        ? "Purchase Return created successfully"
        : "Purchase cancellation recorded successfully",
      data: returnDoc
    });

  } catch (err) {
    console.error("Error creating purchase return:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// 3) Get All Normal Purchases (with Summary)
exports.getAllPurchases = async (req, res) => {
  try {
    // A) Aggregation for summary
    // 1. Count how many normal purchases exist
    const totalInvoices = await Purchase.countDocuments({ isReturn: false });

    // 2. Sum up grandTotal for all normal purchases
    const invoiceAmountAgg = await Purchase.aggregate([
      { $match: { isReturn: false } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalInvoiceAmount = invoiceAmountAgg.length ? invoiceAmountAgg[0].total : 0;

    // 3. Sum all payments for normal purchases
    const paymentsAgg = await Purchase.aggregate([
      { $match: { isReturn: false } },
      { $unwind: "$payments" },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]);
    const totalPaidAmount = paymentsAgg.length ? paymentsAgg[0].total : 0;

    // 4. Total purchase due
    const totalPurchaseDue = totalInvoiceAmount - totalPaidAmount;

    // B) Fetch the list of normal purchases
    const purchases = await Purchase.find({ isReturn: false })
      .populate("warehouse", "warehouseName")
      .populate("supplier", "supplierName email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // Explicit fields

    // Process each purchase to add a computed 'creatorName' field
    const processedPurchases = purchases.map((purchase) => {
      let creatorName = "";
      if (purchase.createdBy) {
        if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
          creatorName = purchase.createdBy.name;
        } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
          creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
        }
      }
      return {
        ...purchase.toObject(),
        creatorName,
      };
    });

    // C) Return summary + list using processedPurchases
    return res.status(200).json({
      success: true,
      summary: {
        totalInvoices,
        totalInvoiceAmount,
        totalPaidAmount,
        totalPurchaseDue,
      },
      data: processedPurchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4) Get All Purchase Returns (with Summary)
exports.getAllPurchaseReturns = async (req, res) => {
  try {
    // A) Aggregation for summary
    // 1. Count how many return invoices exist
    const totalReturnInvoices = await Purchase.countDocuments({ isReturn: true });

    // 2. Sum up grandTotal for all returns
    const returnAmountAgg = await Purchase.aggregate([
      { $match: { isReturn: true } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalReturnInvoiceAmount = returnAmountAgg.length ? returnAmountAgg[0].total : 0;

    // 3. Sum all payments for return purchases
    const paymentsAgg = await Purchase.aggregate([
      { $match: { isReturn: true } },
      { $unwind: "$payments" },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]);
    const totalReturnPaidAmount = paymentsAgg.length ? paymentsAgg[0].total : 0;

    // 4. Total purchase return due
    const totalReturnDue = totalReturnInvoiceAmount - totalReturnPaidAmount;

    // B) Fetch the list of return purchases
    const returns = await Purchase.find({ isReturn: true })
      .populate("warehouse", "warehouseName")
      .populate("supplier", "supplierName email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // populate full document

    // Process each purchase to add a computed 'creatorName' field
    const processedReturns = returns.map(purchase => {
      let creatorName = "";
      if (purchase.createdBy) {
        if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
          creatorName = purchase.createdBy.name;
        } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
          creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
        }
      }
      return {
        ...purchase.toObject(),
        creatorName,
      };
    });

    // C) Return summary + list using processedReturns
    return res.status(200).json({
      success: true,
      summary: {
        totalReturnInvoices,
        totalReturnInvoiceAmount,
        totalReturnPaidAmount,
        totalReturnDue,
      },
      data: processedReturns,
    });
  } catch (error) {
    console.error("Error fetching purchase returns:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5) Get a Single Purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("warehouse", "warehouseName")
      .populate("supplier", "supplierName email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // populate full document

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // Compute creatorName directly for the single purchase
    let creatorName = "";
    if (purchase.createdBy) {
      if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
        creatorName = purchase.createdBy.name;
      } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
        creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
      }
    }

    const processedPurchase = { ...purchase.toObject(), creatorName };

    return res.status(200).json({ success: true, data: processedPurchase });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6) Update a Purchase
exports.updatePurchase = async (req, res) => {
  try {
    const purchaseId = req.params.id;

    /*───────────────────────────────────────────────────────────
      0) Parse request body (your original destructuring)
    ───────────────────────────────────────────────────────────*/
    const {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal,
      items: incomingItems,
      otherCharges = 0,
      discountOnAll = 0,
      discountCouponCode,
      couponType,
      couponValue,
      note,
      payments = [],          // may be omitted by the client
      isReturn = false,
      status,
    } = req.body;

    /*───────────────────────────────────────────────────────────
      1) Fetch the existing purchase (+ old Hold total)
    ───────────────────────────────────────────────────────────*/
    const existing = await Purchase.findById(purchaseId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // get all “Hold” payment-type IDs once
    const holdTypes = await PaymentType.find({
      paymentTypeName: { $regex: /^hold$/i }
    }).select("_id");
    const holdIds = new Set(holdTypes.map(t => t._id.toString()));

    // OLD Hold total (from DB)
    const oldHoldTotal = (existing.payments || []).reduce(
      (sum, p) => holdIds.has((p.paymentType || "").toString())
        ? sum + Number(p.amount || 0)
        : sum,
      0
    );

    /*───────────────────────────────────────────────────────────
      2) Roll back inventory previously added
    ───────────────────────────────────────────────────────────*/
    for (const oldRow of existing.items) {
      const inventoryItemId = oldRow.variant || oldRow.item;
      await updateInventory(existing.warehouse, inventoryItemId, Number(oldRow.quantity));
    }

    /*───────────────────────────────────────────────────────────
      3) Normal validations (unchanged from your code)
    ───────────────────────────────────────────────────────────*/
    if (!warehouse || !supplier || !purchaseDate || !incomingItems?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields or items are empty" });
    }

    const [warehouseDoc, supplierDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id"),
      Supplier.findById(supplier).select("_id"),
    ]);
    if (!warehouseDoc) return res.status(404).json({ success: false, message: "Warehouse not found" });
    if (!supplierDoc)  return res.status(404).json({ success: false, message: "Supplier not found" });

    /*───────────────────────────────────────────────────────────
      4) Coupon handling + item sanitising  (same as before)
    ───────────────────────────────────────────────────────────*/
    let newGrandTotal    = Number(grandTotal);
    let newDiscountOnAll = Number(discountOnAll);

    if (discountCouponCode) {
      const cpn = await DiscountCoupon.findOne({
        couponCode: discountCouponCode,
        status: "Active",
      });
      if (!cpn)  return res.status(400).json({ success: false, message: "Invalid coupon code" });
      if (new Date(cpn.expiryDate) < new Date())
        return res.status(400).json({ success: false, message: "Coupon expired" });

      const discAmount = cpn.couponType === "percentage"
        ? (newGrandTotal * cpn.value) / 100
        : cpn.value;
      newDiscountOnAll += discAmount;
      newGrandTotal    -= discAmount;
    }

    // ---------- sanitize incoming items (unchanged) ----------
   // In updatePurchase, step 4 (item sanitization)
const sanitizedItems = [];
for (const row of incomingItems) {
  const itemDoc = await Item.findById(row.item);
  if (!itemDoc) {
    return res.status(404).json({ success: false, message: `Item not found: ${row.item}` });
  }

  let variantId = null;
  if (itemDoc.itemGroup === "Variant") {
    if (!row.variant) {
      return res.status(400).json({ success: false, message: `Variant ID required for item ${row.item}` });
    }
    const v = itemDoc.variants.id(row.variant);
    if (!v) {
      return res.status(404).json({ success: false, message: `Variant ${row.variant} not found in item ${row.item}` });
    }
    variantId = v._id;
    // Update variant's purchasePrice and salesPrice only for non-raw items
    if (!row.isRaw) {
      await Item.findByIdAndUpdate(
        row.item,
        {
          $set: {
            "variants.$[v].purchasePrice": row.purchasePrice || row.unitCost || 0,
            "variants.$[v].salesPrice": row.salesPrice || 0,
          },
        },
        { arrayFilters: [{ "v._id": row.variant }], new: true }
      );
    }
  } else {
    // Update single item's purchasePrice and salesPrice only for non-raw items
    if (!row.isRaw) {
      await Item.findByIdAndUpdate(row.item, {
        $set: {
          purchasePrice: row.purchasePrice || row.unitCost || 0,
          salesPrice: row.salesPrice || 0,
        },
      });
    }
  }

  sanitizedItems.push({
    item: itemDoc._id,
    variant: variantId,
    quantity: row.quantity || 1,
    purchasePrice: row.purchasePrice != null ? row.purchasePrice : (row.unitCost != null ? row.unitCost : 0),
    mrp: row.mrp || 0,
    salesPrice: row.salesPrice || 0,
    discount: row.discount || 0,
    totalAmount: row.totalAmount || 0,
    expiryDate: row.expiryDate || null,
    isRaw: !!row.isRaw,
    bulkQty: row.bulkQty || null,
    bulkUnit: row.bulkUnit || null,
    bulkCost: row.bulkCost || null,
  });
}
    /*───────────────────────────────────────────────────────────
      5) Validate payments + compute NEW Hold total
    ───────────────────────────────────────────────────────────*/
    let sumPaid       = 0;
    let newHoldTotal  = 0;

    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) {
        return res.status(404).json({ success: false, message: "Payment type not found" });
      }
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ success: false, message: "Bank payment requires terminal id" });
      }
      if (!p.paymentCode) {
        p.paymentCode = `PMT/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`;
      }
      sumPaid += Number(p.amount || 0);

      if (/^hold$/i.test(pt.paymentTypeName)) {
        newHoldTotal += Number(p.amount || 0);
      }
    }

    /*───────────────────────────────────────────────────────────
      6) Update supplier.purchaseDue by the delta
    ───────────────────────────────────────────────────────────*/
    const delta = newHoldTotal - oldHoldTotal;   // could be positive or negative
    if (delta !== 0) {
      await Supplier.findByIdAndUpdate(
        supplier,
        { $inc: { purchaseDue: delta } },
        { new: false }
      );
    }

    /*───────────────────────────────────────────────────────────
      7) Build & persist the updated purchase (unchanged)
    ───────────────────────────────────────────────────────────*/
    const balanceDue   = sumPaid < newGrandTotal ? newGrandTotal - sumPaid : 0;
    const changeReturn = sumPaid > newGrandTotal ? sumPaid - newGrandTotal : 0;

    const updatedData = {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal:    newGrandTotal,
      items:         sanitizedItems,
      otherCharges,
      discountOnAll: newDiscountOnAll,
      discountCouponCode,
      couponType,
      couponValue,
      note,
      payments,
      isReturn,
      status:        status || (isReturn ? "Return" : "Normal"),
      balanceDue,
      changeReturn,
    };

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      updatedData,
      { new: true }
    );
    if (!updatedPurchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    /*───────────────────────────────────────────────────────────
      8) Re-apply inventory for NEW rows  (unchanged)
    ───────────────────────────────────────────────────────────*/
    for (const row of sanitizedItems) {
      const inventoryItemId = row.variant || row.item;
      const qtyDelta = isReturn ? -Number(row.quantity) : Number(row.quantity);
      await updateInventory(warehouse, inventoryItemId, qtyDelta);
    }

    /*───────────────────────────────────────────────────────────
      9) Rewrite payment ledger (unchanged)
    ───────────────────────────────────────────────────────────*/
    const negativePayments = updatedPurchase.payments.map(p => ({
      ...p,
      amount: -(Number(p.amount) || 0),
    }));
    await recordSale({
      warehouseId: warehouse,
      payments:    negativePayments,
      referenceId: updatedPurchase._id,
      refModel:    "Purchase",
    });

    /*───────────────────────────────────────────────────────────*/
    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: updatedPurchase,
    });
  } catch (err) {
    console.error("Error updating purchase:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// 7) Delete a Purchase
exports.deletePurchase = async (req, res) => {
  try {
    // 1) Find the purchase
    const purchase = await Purchase.findById(req.params.id).lean();
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // 2) Roll back inventory: subtracting a purchase had +qty, so now −qty
    await Promise.all(purchase.items.map(row => {
      const inventoryItemId = row.variant || row.item;
      return updateInventory(purchase.warehouse, inventoryItemId, -Number(row.quantity));
    }));

    // 3) Remove ledger entries for this purchase
    //    recordSale wrote entries of type CASH_SALE or BANK_SALE for "Purchase"
    await Ledger.deleteMany({
      warehouse:   purchase.warehouse,
      referenceId: purchase._id,
      refModel:    "Purchase",
      type:        { $in: ["CASH_SALE","BANK_SALE"] }
    });

    // 4) If you ever bumped supplier.purchaseDue for any Hold payments, roll that back
    //    Compute total “Hold” in purchase.payments and subtract it from supplier.purchaseDue
    const holdTypes = await PaymentType.find({
      paymentTypeName: { $regex: /^hold$/i }
    }).select("_id");
    const holdIds = new Set(holdTypes.map(t => t._id.toString()));

    const holdAmt = (purchase.payments || []).reduce((sum, p) => 
      holdIds.has((p.paymentType||"").toString())
        ? sum + Number(p.amount||0)
        : sum
    , 0);

    if (holdAmt > 0) {
      // subtract what you previously added
      await Supplier.findByIdAndUpdate(
        purchase.supplier,
        { $inc: { purchaseDue: -holdAmt } },
        { new: false }
      );
    }

    // 5) Finally delete the purchase document
    await Purchase.findByIdAndDelete(purchase._id);

    return res
      .status(200)
      .json({ success: true, message: "Purchase deleted and rolled back successfully" });
  }
  catch (err) {
    console.error("deletePurchase error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

