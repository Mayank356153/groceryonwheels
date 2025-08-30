const mongoose       = require("mongoose");
const Sales          = require("../models/Sales");
const Warehouse      = require("../models/warehouseModel");
const Customer       = require("../models/customerDataModel");
const Item           = require("../models/itemModel");
const PaymentType    = require("../models/paymentTypeModel");
const Tax            = require("../models/taxModel");
const DiscountCoupon = require("../models/discountCouponModel");
const { recordSale } = require("../services/recordSale");
const { updateInventory } = require("../helpers/inventory");
const Ledger = require("../models/ledgerModel");

/*──────────────────────── helpers ────────────────────────*/
function genPaymentCode(prefix = "PMT/2025/") {
  const n = Math.floor(Math.random() * 9000) + 1000; // 4‑digit
  return `${prefix}${n}`;
}

/*──────────────────────── CREATE ─────────────────────────*/
exports.createSale = async (req, res) => {
  try {
    const {
      warehouse,
      customer,
      saleDate,
      referenceNo,
      items,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnBill,
      note,
      payments = [],
      status,
    } = req.body;

    if (!warehouse || !customer || !items?.length)
      return res.status(400).json({ message: "Missing required fields" });

    // 1) look-ups
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id cashAccount"),
      Customer.findById(customer).select("_id"),
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found" });
    if (!customerDoc)  return res.status(404).json({ message: "Customer not found" });

    // 2) build items + subtotal
    let subtotal   = 0;
    const validItems = [];
    for (const row of items) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc)
        return res.status(404).json({ message: `Item not found: ${row.item}` });

      let variantId = null;
      if (row.variant) {
        const v = itemDoc.variants.id(row.variant);
        if (!v)
          return res.status(404).json({ message: `Variant not found: ${row.variant}` });
        variantId = v._id;
      }

      // compute line subtotal
      const line = (row.unitPrice - (row.discount||0) + (row.taxAmount||0)) * row.quantity;
      subtotal += line;

      validItems.push({
        item:      itemDoc._id,
        variant:   variantId,
        quantity:  row.quantity,
        unitPrice: row.unitPrice,
        discount:  row.discount  || 0,
        tax:       row.tax       || null,
        taxAmount: row.taxAmount || 0,
        subtotal:  line,
      });
    }

    // 3) grandTotal
    let grandTotal = subtotal + (otherCharges||0);
    if (couponType === "percentage")
      grandTotal -= (grandTotal * (couponValue||0))/100;
    else if (couponType === "value")
      grandTotal -= (couponValue||0);
    if (discountOnBill) grandTotal -= discountOnBill;

    // 4) payments validation & code
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found" });
      if (pt.paymentTypeName === "Bank" && !p.terminal)
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      if (!p.paymentCode) p.paymentCode = genPaymentCode();
    }

    // 5) create the sale
    const sale = await Sales.create({
      createdBy:      req.user._id,
      createdByModel: req.user.role.toLowerCase() === "admin" ? "Admin" : "User",
      warehouse,
      customer,
      createdBy:           req.user?.id || null,
      createdByModel:      req.user?.role?.toLowerCase()==='admin' ? 'Admin':'User',
      saleDate,
      referenceNo,
      items:               validItems,
      otherCharges:        otherCharges || 0,
      discountCouponCode:  discountCouponCode || '',
      couponType:          couponType || '',
      couponValue:         couponValue || 0,
      discountOnBill:      discountOnBill || 0,
      note:                note || '',
      payments,
      subtotal,
      grandTotal,
      status:              status || "Completed",
    });

    // 6) update inventory ledger (negative = sold)
    for (const row of validItems) {
      const invId = row.variant ?? row.item;
      await updateInventory(warehouse, invId, -Number(row.quantity));
    }

    // 7) record payment ledger
    await recordSale({
      warehouseId: warehouse,
      payments:    sale.payments,
      referenceId: sale._id,
      refModel:    'Sale'
    });

    return res.status(201).json({ message: "Sale created successfully!", sale });
  }
  catch (err) {
    console.error("createSale error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const totalInvoices = await Sales.countDocuments({});
    const invoiceAmountAgg = await Sales.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalInvoiceAmount = invoiceAmountAgg.length ? invoiceAmountAgg[0].total : 0;

    const paymentsAgg = await Sales.aggregate([
      { $unwind: "$payments" },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]);
    const totalReceivedAmount = paymentsAgg.length ? paymentsAgg[0].total : 0;
    const totalSalesDue = totalInvoiceAmount - totalReceivedAmount;

    // Retrieve all sales with required population.
    const sales = await Sales.find()
      .populate("warehouse customer payments.paymentType")
      .populate({ path: "items.item" })
      .populate({ path: "items.tax" })
      // Populate createdBy with proper fields.
      .populate("createdBy", "name FirstName LastName email")
      // No need for select here as we want full document data including createdByModel.
      ;

    const processedSales = sales.map((sale) => {
      let creatorName = "";
      if (sale.createdBy) {
        // For admin
        if (sale.createdByModel === "Admin" && sale.createdBy.name) {
          creatorName = sale.createdBy.name;
        }
        // For users: combine FirstName and LastName if available
        else if (sale.createdBy.FirstName && sale.createdBy.LastName) {
          creatorName = `${sale.createdBy.FirstName} ${sale.createdBy.LastName}`;
        }
      }
      return {
        ...sale.toObject(),
        creatorName,
      };
    });

    res.status(200).json({
      summary: {
        totalInvoices,
        totalInvoiceAmount,
        totalReceivedAmount,
        totalSalesDue,
      },
      sales: processedSales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// GET Sales Payments (Using aggregation)
exports.getSalesPayments = async (req, res) => {
  try {
    const { paymentType, paymentStatus } = req.query;

    const pipeline = [
      { $unwind: "$payments" },
      {
        $match: {
          ...(paymentType
            ? { "payments.paymentType": new mongoose.Types.ObjectId(paymentType) }
            : {}),
          ...(paymentStatus ? { "payments.paymentStatus": paymentStatus } : {}),
        },
      },
      {
        $lookup: {
          from: "paymenttypes",
          localField: "payments.paymentType",
          foreignField: "_id",
          as: "paymentTypeData",
        },
      },
      {
        $addFields: {
          "payments.paymentTypeData": { $arrayElemAt: ["$paymentTypeData", 0] },
        },
      },
      {
        $lookup: {
          from: "customerdatas",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      {
        $addFields: {
          customerDoc: { $arrayElemAt: ["$customerDoc", 0] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByUser",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByAdmin",
        },
      },
      {
        $addFields: {
          createdByDoc: {
            $cond: {
              if: { $gt: [{ $size: "$createdByUser" }, 0] },
              then: { $arrayElemAt: ["$createdByUser", 0] },
              else: { $arrayElemAt: ["$createdByAdmin", 0] },
            },
          },
        },
      },
    ];

    const payments = await Sales.aggregate(pipeline);

    const formatted = payments.map((doc) => {
      let creatorName = "";
      if (doc.createdByDoc) {
        if (
          doc.createdByModel === "Admin" &&
          doc.createdByDoc.name &&
          doc.createdByDoc.name !== ""
        ) {
          creatorName = doc.createdByDoc.name;
        } else if (
          doc.createdByDoc.FirstName &&
          doc.createdByDoc.LastName &&
          (doc.createdByDoc.FirstName !== "" || doc.createdByDoc.LastName !== "")
        ) {
          creatorName = `${doc.createdByDoc.FirstName} ${doc.createdByDoc.LastName}`;
        }
      }

      return {
        saleId: doc._id,
        paymentId  : doc.payments._id,
        saleCode: doc.saleCode,
        customer: doc.customerDoc?.customerName || "Unknown",
        paymentCode: doc.payments.paymentCode || "N/A",
        paymentDate: doc.payments.paymentDate,
        paymentType: doc.payments.paymentTypeData?.paymentTypeName || "Unknown",
        paymentAmount: doc.payments.amount,
        paymentNote: doc.payments.paymentNote,
        creatorName,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET Single Sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id)
      .populate("warehouse customer payments.paymentType")
      .populate({ path: "items.item" })
      .populate({ path: "items.tax", model: "Tax" })
      // Populate createdBy and include createdByModel
      .populate("createdBy", "name FirstName LastName email");
    if (!sale) {
      return res.status(404).json({ message: "Sale not found!" });
    }

    let creatorName = "";
    if (sale.createdBy) {
      if (sale.createdByModel === "Admin" && sale.createdBy.name) {
        creatorName = sale.createdBy.name;
      } else if (sale.createdBy.FirstName && sale.createdBy.LastName) {
        creatorName = `${sale.createdBy.FirstName} ${sale.createdBy.LastName}`;
      }
    }

    const processedSale = { ...sale.toObject(), creatorName };
    res.status(200).json(processedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE Sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      warehouse,
      customer,
      items,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnBill,
      note,
      payments = [],
      status,
    } = req.body;

    if (!warehouse || !customer || !items?.length)
      return res.status(400).json({ message: "Missing required fields" });

    // 1) fetch existing & roll it back
    const existing = await Sales.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Sale not found" });
    for (const old of existing.items) {
      const invId = old.variant ?? old.item;
      await updateInventory(existing.warehouse, invId,  Number(old.quantity));
    }

    // 2) rebuild validItems + subtotal
    let subtotal   = 0;
    const validItems = [];
    for (const row of items) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc)
        return res.status(404).json({ message: `Item not found: ${row.item}` });

      let variantId = null;
      if (row.variant) {
        const v = itemDoc.variants.id(row.variant);
        if (!v)
          return res.status(404).json({ message: `Variant not found: ${row.variant}` });
        variantId = v._id;
      }

      const line = (row.unitPrice - (row.discount||0) + (row.taxAmount||0)) * row.quantity;
      subtotal    += line;

      validItems.push({
        item:      itemDoc._id,
        variant:   variantId,
        quantity:  row.quantity,
        unitPrice: row.unitPrice,
        discount:  row.discount  || 0,
        tax:       row.tax       || null,
        taxAmount: row.taxAmount || 0,
        subtotal:  line,
      });
    }

    // 3) grandTotal
    let grandTotal = subtotal + (otherCharges||0);
    if (couponType === "percentage")
      grandTotal -= (grandTotal * (couponValue||0))/100;
    else if (couponType === "value")
      grandTotal -= (couponValue||0);
    if (discountOnBill) grandTotal -= discountOnBill;

    // 4) payments validation & code
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found" });
      if (pt.paymentTypeName === "Bank" && !p.terminal)
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      if (!p.paymentCode) p.paymentCode = genPaymentCode();
    }

    // 5) persist the update
    const updated = await Sales.findByIdAndUpdate(
      id,
      {
        warehouse,
        customer,
        items:               validItems,
        otherCharges,
        discountCouponCode,
        couponType,
        couponValue,
        discountOnBill,
        note,
        payments,
        subtotal,
        grandTotal,
        status,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Sale not found" });

    // 6) apply new deductions
    for (const row of validItems) {
      const invId = row.variant ?? row.item;
      await updateInventory(warehouse, invId, -Number(row.quantity));
    }

    // 7) rewrite payment ledger
    await recordSale({
      warehouseId: warehouse,
      payments:    updated.payments,
      referenceId: updated._id,
      refModel:    'Sale'
    });

    return res.json({ message: "Sale updated successfully!", sale: updated });
  }
  catch (err) {
    console.error("updateSale error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// DELETE Sale
exports.deleteSale = async (req, res) => {
  try {
    // 1) Fetch the sale
    const sale = await Sales.findById(req.params.id).lean();
    if (!sale) {
      return res.status(404).json({ message: "Sale not found!" });
    }

    // 2) Roll back inventory: adding back what was sold
    await Promise.all(sale.items.map(row => {
      const invId = row.variant ?? row.item;
      return updateInventory(sale.warehouse, invId, Number(row.quantity));
    }));

    // 3) Remove the CASH_SALE & BANK_SALE ledger entries
    await Ledger.deleteMany({
      warehouse:   sale.warehouse,
      referenceId: sale._id,
      refModel:    "Sale",
      type:        { $in: ["CASH_SALE","BANK_SALE"] }
    });

    // 4) Delete the sale document
    await Sales.findByIdAndDelete(sale._id);

    return res
      .status(200)
      .json({ message: "Sale deleted and rollback completed successfully!" });
  } catch (err) {
    console.error("deleteSale error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// ──────────────────  DELETE /api/payments/:id  ──────────────────
exports.deleteSalePayment = async (req, res) => {
  try {
    const { id: paymentId } = req.params;               // /api/payments/:id
    const userId = req.user?._id;                       // for auth logging etc.

    // 1️⃣  locate the parent Sale that owns this payment row
    const sale = await Sales.findOne({ "payments._id": paymentId });
    if (!sale) return res.status(404).json({ message: "Payment not found" });

    // 2️⃣  remove the payment sub-doc
    const payDoc = sale.payments.id(paymentId);
    payDoc.remove();                                    // Mongoose sub-doc API
    await sale.save();                                  // persists the change

    // 3️⃣  (optional) clean up ledgers that pointed at this payment   
    await Ledger.deleteMany({
      referenceId : paymentId,
      refModel    : "Payment",                          // or whatever you stored
      warehouse   : sale.warehouse,
    });

    console.log(`user ${userId} deleted payment ${paymentId}`);
    return res.status(204).end();                       // 204 No Content
  } catch (err) {
    console.error("deleteSalePayment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET Recent Sales Invoices
exports.getRecentSalesInvoices = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Fetch recent sales sorted by creation date, limit the records,
    // populate customer and createdBy (including createdByModel in selection)
    const recentSales = await Sales.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("customer", "name phone email")
      .populate("createdBy", "FirstName LastName name")
      .select("saleCode createdAt grandTotal status customer createdBy createdByModel");

    // Process the fetched sales to compute a human-readable creatorName
    const processedSales = recentSales.map((sale) => {
      let creatorName = "";
      if (sale.createdBy) {
        if (sale.createdBy.name) {
          creatorName = sale.createdBy.name;
        } else if (sale.createdBy.FirstName && sale.createdBy.LastName) {
          creatorName = `${sale.createdBy.FirstName} ${sale.createdBy.LastName}`;
        }
      }
      return {
        ...sale.toObject(),
        creatorName,
      };
    });

    return res.status(200).json({
      success: true,
      data: processedSales,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET Filtered Sales for Sales Payment Report
exports.getFilteredSales = async (req, res) => {
  try {
    const { customerId, fromDate, toDate } = req.query;

    // Validate customerId if provided
    if (customerId && !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Build query
    const query = {};

    // Filter by customerId
    if (customerId) {
      query.customer = customerId;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.saleDate = {};
      if (fromDate) {
        query.saleDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.saleDate.$lte = new Date(toDate);
      }
    }

    // Fetch filtered sales with population
    const sales = await Sales.find(query)
      .populate("customer", "customerName")
      .populate({ path: "items.item", select: "name" })
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy", "name FirstName LastName email");

    // Process sales to match frontend expectations
    const processedSales = sales.map((sale) => {
      let creatorName = "";
      if (sale.createdBy) {
        if (sale.createdByModel === "Admin" && sale.createdBy.name) {
          creatorName = sale.createdBy.name;
        } else if (sale.createdBy.FirstName && sale.createdBy.LastName) {
          creatorName = `${sale.createdBy.FirstName} ${sale.createdBy.LastName}`;
        }
      }

      // Map items to include itemName
      const formattedItems = sale.items.map((item) => ({
        itemName: item.item?.name || "Unknown",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        taxAmount: item.taxAmount || 0,
        subtotal: item.subtotal || 0,
      }));

      return {
        _id: sale._id,
        customer: sale.customer,
        saleDate: sale.saleDate,
        saleCode: sale.saleCode,
        referenceNo: sale.referenceNo || "",
        items: formattedItems,
        otherCharges: sale.otherCharges || 0,
        discountCouponCode: sale.discountCouponCode || "",
        couponType: sale.couponType || "",
        couponValue: sale.couponValue || 0,
        discountOnBill: sale.discountOnBill || 0,
        note: sale.note || "",
        payments: sale.payments || [],
        subtotal: sale.subtotal || 0,
        grandTotal: sale.grandTotal || 0,
        status: sale.status || "Draft",
        creatorName,
      };
    });

    // Calculate summary
    const totalInvoices = processedSales.length;
    const totalInvoiceAmount = processedSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalReceivedAmount = processedSales.reduce(
      (sum, sale) =>
        sum +
        (sale.payments?.reduce((pSum, payment) => pSum + (payment.amount || 0), 0) || 0),
      0
    );
    const totalSalesDue = totalInvoiceAmount - totalReceivedAmount;

    res.status(200).json({
      summary: {
        totalInvoices,
        totalInvoiceAmount,
        totalReceivedAmount,
        totalSalesDue,
      },
      sales: processedSales,
    });
  } catch (error) {
    console.error("Filtered sales error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





exports.updateSalePaymentType = async (req, res) => {
  try {
    const { paymentType } = req.body;
    if (!paymentType) {
      return res.status(400).json({ message: "paymentType is required" });
    }

    const sale = await Sales.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    
    if (!sale.payments.length) {
      return res.status(400).json({ message: "No payments to update" });
    }

    
    sale.payments[0].paymentType = paymentType;
    if (!sale.payments[0].paymentDate) {
      sale.payments[0].paymentDate = sale.saleDate;
    }

    await sale.save();
    await recordSale({
      warehouseId: sale.warehouse,
      payments: sale.payments,
      referenceId: sale._id,
      refModel: "Sale",
    });

    return res.json({ success: true, sale });
  } catch (err) {
    console.error("updateSalePaymentType error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
