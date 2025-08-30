/* eslint-disable no-await-in-loop */
const mongoose = require("mongoose");
const Sales = require("../models/Sales");
const PosOrder = require("../models/PosOrder");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const PaymentType = require("../models/paymentTypeModel"); // Added for paymentMethod support

/* ------------------------------------------------------------------ */
/* Helper: breadth-first crawl – current user + everybody they created */
async function getDescendantUserIds(rootId) {
  const queue = [rootId.toString()];
  const all = new Set(queue); // avoid duplicates / cycles

  while (queue.length) {
    const parent = queue.shift();
    const kids = await User.find({ createdBy: parent }, "_id").lean();
    for (const kid of kids) {
      const id = kid._id.toString();
      if (!all.has(id)) {
        all.add(id);
        queue.push(id);
      }
    }
  }
  return Array.from(all); // string array is fine – Mongoose casts
}

/* ------------------------------------------------------------------ */
/* Helper: build a readable name from either Admin or User schema      */
const fullName = (doc) => {
  if (!doc) return '—'; // ← nothing populated / deleted user
  if (typeof doc === 'string') return doc; // plain text already
  return (
    doc.name?.trim() || // Admin model
    `${doc.FirstName || ''} ${doc.LastName || ''}`.trim() || // User model
    '—' // fallback
  );
};

/* ------------------------------------------------------------------ */
/* GET /api/pos/invoices – unified list of Sale + POS invoices         */
exports.getAllInvoices = async (req, res) => {
  try {
    /* -------------------------------------------------------------- */
    /* 1) Permission filter – owner sees everything, others see themselves + descendants */
    /* -------------------------------------------------------------- */
    const caller = await User.findById(req.user.id)
      .select('createdBy Role')
      .populate({
        path: 'Role',
        select: 'roleName',
        options: { lean: true },
        strictPopulate: false
      })
      .lean();

    let roleName = '';
    const grabName = async (val) => {
      if (!val) return;
      if (typeof val === 'string') { roleName = val; return; }
      if (val.roleName) { roleName = val.roleName; return; }
      if (mongoose.isValidObjectId(val)) {
        const rDoc = await Role.findById(val, 'roleName').lean();
        if (rDoc?.roleName) roleName = rDoc.roleName;
      }
    };

    if (Array.isArray(caller.Role)) {
      for (const r of caller.Role) {
        await grabName(r);
        if (roleName) break; // first hit wins
      }
    } else {
      await grabName(caller.Role);
    }

    console.log('resolved roleName =>', roleName);

    const elevatedRoles = ["admin", "ca", "saleanalyst"];
    const isRoot = !caller.createdBy || elevatedRoles.includes(roleName.toLowerCase());

    let userFilter = {};
    if (!isRoot) {
      const allowed = await getDescendantUserIds(req.user.id);
      userFilter = { createdBy: { $in: allowed } };
    }

    /* -------------------------------------------------------------- */
    /* 2) Optional filtering based on query params */
    /* -------------------------------------------------------------- */
    const { start, end, warehouseId, paymentMethod } = req.query;
    let dateFilter = {};
    let warehouseFilter = {};
    let paymentFilter = {};

    if (start && end) {
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);
      dateFilter = { $or: [{ saleDate: { $gte: startDate, $lte: endDate } }, { createdAt: { $gte: startDate, $lte: endDate } }] };
    } else if (start) { // Single date from ledger
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(start);
      endDate.setUTCHours(23, 59, 59, 999);
      dateFilter = { $or: [{ saleDate: { $gte: startDate, $lte: endDate } }, { createdAt: { $gte: startDate, $lte: endDate } }] };
    }

    if (warehouseId) {
      warehouseFilter = { warehouse: new mongoose.Types.ObjectId(warehouseId) };
    }

    if (paymentMethod) {
      const ptName = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
      const pt = await PaymentType.findOne({ paymentTypeName: ptName }).select('_id');
      if (pt) {
        paymentFilter = { 'payments.paymentType': pt._id };
      } else {
        console.warn(`Payment type ${ptName} not found, skipping payment filter`);
      }
    }

    const salesFilter = { ...userFilter, ...dateFilter, ...warehouseFilter, ...paymentFilter };
    const posFilter = { ...userFilter, ...dateFilter, ...warehouseFilter, ...paymentFilter };
    console.log('Sales Filter:', salesFilter);
    console.log('Pos Filter:', posFilter);
    console.log('Raw query params:', req.query);

    /* -------------------------------------------------------------- */
    /* 3) Common populate list – same for Sales and PosOrder          */
    /* -------------------------------------------------------------- */
    const pops = [
      { path: "customer", select: "customerName" },
      { path: "warehouse" },
      {
        path: "items.item",
        populate: [
          { path: "category" },
          { path: "subCategory" },
          { path: "subSubCategory" },
          { path: "brand" },
          { path: "tax" },
          { path: "unit" },
        ]
      },
      {
        path: "payments",
        populate: { path: "paymentType", select: "paymentTypeName" }
      },
      {
        path: "createdBy",
        select: "name FirstName LastName role"
      }
    ];

    /* -------------------------------------------------------------- */
    /* 4) Fetch both collections in parallel                          */
    /* -------------------------------------------------------------- */
    const [sales, pos] = await Promise.all([
      Sales.find(salesFilter).populate(pops).lean(),
      PosOrder.find(posFilter).populate(pops).lean()
    ]);

    /* -------------------------------------------------------------- */
    /* 5) Helper: quick payment-status check                          */
    /* -------------------------------------------------------------- */
    const paidEnough = (doc, field) =>
      (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0) >= doc[field]
        ? "Paid"
        : "Unpaid";

    /* -------------------------------------------------------------- */
    /* 6) Merge + normalize both result sets                          */
    /* -------------------------------------------------------------- */
    const unified = [
      ...sales.map(d => ({
        ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.saleDate,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy),
        paymentAmount: paymentFilter['payments.paymentType'] ? d.payments.reduce((sum, p) => p.paymentType?.toString() === paymentFilter['payments.paymentType'] ? sum + (p.amount || 0) : sum, 0) : d.payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalAmount: d.grandTotal || 0
      })),
      ...pos.map(d => ({
        ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.createdAt,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.totalAmount,
        source: "POS",
        paymentStatus: paidEnough(d, "totalAmount"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy),
        paymentAmount: paymentFilter['payments.paymentType'] ? d.payments.reduce((sum, p) => p.paymentType?.toString() === paymentFilter['payments.paymentType'] ? sum + (p.amount || 0) : sum, 0) : d.payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalAmount: d.totalAmount || 0
      }))
    ].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

    return res.json(unified);
  } catch (err) {
    console.error("getAllInvoices error:", err);
    return res.status(500).json({ message: err.message });
  }
};

//for clb bill (unchanged for now)
exports.getAllInvoicesClub = async (req, res) => {
  try {
    const caller = await User.findById(req.user.id)
      .select("createdBy Role")
      .populate({
        path: "Role",
        select: "roleName",
        options: { lean: true },
        strictPopulate: false,
      })
      .lean();

    let roleName = "";
    const grabName = async (val) => {
      if (!val) return;
      if (typeof val === "string") {
        roleName = val;
        return;
      }
      if (val.roleName) {
        roleName = val.roleName;
        return;
      }
      if (mongoose.isValidObjectId(val)) {
        const rDoc = await Role.findById(val, "roleName").lean();
        if (rDoc?.roleName) roleName = rDoc.roleName;
      }
    };

    if (Array.isArray(caller.Role)) {
      for (const r of caller.Role) {
        await grabName(r);
        if (roleName) break;
      }
    } else {
      await grabName(caller.Role);
    }

    const elevatedRoles = ["admin", "ca", "saleanalyst"];
    const isRoot =
      !caller.createdBy || elevatedRoles.includes(roleName.toLowerCase());

    let filter = {};
    if (!isRoot) {
      const allowed = await getDescendantUserIds(req.user.id);
      filter = { createdBy: { $in: allowed } };
    }

    let page = parseInt(req.query.page) || 5;
    let limit = parseInt(req.query.limit) || 50;
    let skip = (page - 1) * limit;

    const us = await User.findById(req.user.id);
    const warehouseIds = us.WarehouseGroup; 
    const warehouseFilter = { warehouse: { $in: warehouseIds } };

    const pops = [
      { path: "customer", select: "customerName" },
      { path: "warehouse" },
      {
        path: "items.item",
        populate: [
          { path: "category" },
          { path: "subCategory" },
          { path: "subSubCategory" },
          { path: "brand" },
          { path: "tax" },
          { path: "unit" },
        ],
      },
      {
        path: "payments",
        populate: { path: "paymentType", select: "paymentTypeName" },
      },
      {
        path: "createdBy",
        select: "name FirstName LastName role",
      },
    ];

    // fetch all (without skip/limit yet)
    const [sales, pos] = await Promise.all([
      Sales.find({
        $or: [filter, warehouseFilter],
      })
        .populate(pops)
        .lean(),
      PosOrder.find({
        $or: [filter, warehouseFilter],
      })
        .populate(pops)
        .lean(),
    ]);

    const paidEnough = (doc, field) =>
      (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0) >= doc[field]
        ? "Paid"
        : "Unpaid";

    const unified = [
      ...sales.map((d) => ({
         ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.saleDate,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy)
      })),
      ...pos.map((d) => ({
         ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.saleDate,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy)
      })),
    ].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

    // apply pagination here
    const total = unified.length;
    const paginated = unified.slice(skip, skip + limit);

    return res.json({
      data: unified,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    });
  } catch (err) {
    console.error("getAllInvoiceCode error:", err);
    return res.status(500).json({ message: err.message });
  }
};


exports.getInvoiceCode = async (req, res) => {
  try {
    const caller = await User.findById(req.user.id)
      .select("createdBy Role")
      .populate({
        path: "Role",
        select: "roleName",
        options: { lean: true },
        strictPopulate: false,
      })
      .lean();

    let roleName = "";
    const grabName = async (val) => {
      if (!val) return;
      if (typeof val === "string") {
        roleName = val;
        return;
      }
      if (val.roleName) {
        roleName = val.roleName;
        return;
      }
      if (mongoose.isValidObjectId(val)) {
        const rDoc = await Role.findById(val, "roleName").lean();
        if (rDoc?.roleName) roleName = rDoc.roleName;
      }
    };

    if (Array.isArray(caller.Role)) {
      for (const r of caller.Role) {
        await grabName(r);
        if (roleName) break;
      }
    } else {
      await grabName(caller.Role);
    }

    const elevatedRoles = ["admin", "ca", "saleanalyst"];
    const isRoot =
      !caller.createdBy || elevatedRoles.includes(roleName.toLowerCase());

    let filter = {};
    if (!isRoot) {
      const allowed = await getDescendantUserIds(req.user.id);
      filter = { createdBy: { $in: allowed } };
    }

    let page = parseInt(req.query.page) || 5;
    let limit = parseInt(req.query.limit) || 50;
    let skip = (page - 1) * limit;

    const us = await User.findById(req.user.id);
    const warehouseIds = us.WarehouseGroup; 
    const warehouseFilter = { warehouse: { $in: warehouseIds } };

    const pops = [
      { path: "customer", select: "customerName" },
      { path: "warehouse" },
      {
        path: "items.item",
        populate: [
          { path: "category" },
          { path: "subCategory" },
          { path: "subSubCategory" },
          { path: "brand" },
          { path: "tax" },
          { path: "unit" },
        ],
      },
      {
        path: "payments",
        populate: { path: "paymentType", select: "paymentTypeName" },
      },
      {
        path: "createdBy",
        select: "name FirstName LastName role",
      },
    ];

    // fetch all (without skip/limit yet)
    const [sales, pos] = await Promise.all([
      Sales.find({
        $or: [filter, warehouseFilter],
      })
        .populate(pops)
        .lean(),
      PosOrder.find({
        $or: [filter, warehouseFilter],
      })
        .populate(pops)
        .lean(),
    ]);

    const paidEnough = (doc, field) =>
      (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0) >= doc[field]
        ? "Paid"
        : "Unpaid";

    const unified = [
      ...sales.map((d) => ({
        ...d,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.saleDate,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy),
      })),
      ...pos.map((d) => ({
        ...d,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.createdAt,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.totalAmount,
        source: "POS",
        paymentStatus: paidEnough(d, "totalAmount"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy),
      })),
    ].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

    // apply pagination here
   
    return res.json(unified[0].saleCode);
  } catch (err) {
    console.error("getAllInvoiceCode error:", err);
    return res.status(500).json({ message: err.message });
  }
};


exports.getLatestInvoices=async(req,res)=>{
   try {
    /* -------------------------------------------------------------- */
    /* 1) Permission filter – owner sees everything, others see themselves + descendants */
    /* -------------------------------------------------------------- */
    const caller = await User.findById(req.user.id)
      .select('createdBy Role')
      .populate({
        path: 'Role',
        select: 'roleName',
        options: { lean: true },
        strictPopulate: false
      })
      .lean();

    let roleName = '';
    const grabName = async (val) => {
      if (!val) return;
      if (typeof val === 'string') { roleName = val; return; }
      if (val.roleName) { roleName = val.roleName; return; }
      if (mongoose.isValidObjectId(val)) {
        const rDoc = await Role.findById(val, 'roleName').lean();
        if (rDoc?.roleName) roleName = rDoc.roleName;
      }
    };

    if (Array.isArray(caller.Role)) {
      for (const r of caller.Role) {
        await grabName(r);
        if (roleName) break; // first hit wins
      }
    } else {
      await grabName(caller.Role);
    }

    console.log('resolved roleName =>', roleName);

    const elevatedRoles = ["admin", "ca", "saleanalyst"];
    const isRoot = !caller.createdBy || elevatedRoles.includes(roleName.toLowerCase());

    let filter = {};
    if (!isRoot) {
      const allowed = await getDescendantUserIds(req.user.id);
      filter = { createdBy: { $in: allowed } };
    }

    const us = await User.findById(req.user.id);
    const warehouseIds = us.WarehouseGroup; // already ObjectIds
    const warehouseFilter = { warehouse: { $in: warehouseIds } };
    console.log("warehouseFilter =>", warehouseFilter);
    console.log("user", us);

    /* -------------------------------------------------------------- */
    /* 2) Common populate list – same for Sales and PosOrder          */
    /* -------------------------------------------------------------- */
    const pops = [
      { path: "customer", select: "customerName" },
      { path: "warehouse" },
      {
        path: "items.item",
        populate: [
          { path: "category" },
          { path: "subCategory" },
          { path: "subSubCategory" },
          { path: "brand" },
          { path: "tax" },
          { path: "unit" },
        ]
      },
      {
        path: "payments",
        populate: { path: "paymentType", select: "paymentTypeName" }
      },
      {
        path: "createdBy",
        select: "name FirstName LastName role"
      }
    ];

    /* -------------------------------------------------------------- */
    /* 3) Fetch both collections in parallel                          */
    /* -------------------------------------------------------------- */
    const [sales, pos] = await Promise.all([
      Sales.find({
        $or: [filter, warehouseFilter]
      }).populate(pops).lean(),
      PosOrder.find({
        $or: [filter, warehouseFilter]
      }).populate(pops).lean()
    ]);

    /* -------------------------------------------------------------- */
    /* 4) Helper: quick payment-status check                          */
    /* -------------------------------------------------------------- */
    const paidEnough = (doc, field) =>
      (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0) >= doc[field]
        ? "Paid"
        : "Unpaid";

    /* -------------------------------------------------------------- */
    /* 5) Merge + normalize both result sets                          */
    /* -------------------------------------------------------------- */
    const unified = [
      ...sales.map(d => ({
        ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.saleDate,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy)
      })),
      ...pos.map(d => ({
        ...d,
        warehouse: d.warehouse,
        _id: d._id,
        items: d.items,
        saleCode: d.saleCode,
        saleDate: d.createdAt,
        customer: d.customer,
        warehouse: d.warehouse,
        amount: d.totalAmount,
        source: "POS",
        paymentStatus: paidEnough(d, "totalAmount"),
        payments: d.payments || [],
        creatorName: fullName(d.createdBy)
      }))
    ].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    return res.json(unified.slice(0, 10));
  } catch (err) {
    console.error("getAllInvoiceCode error:", err);
    return res.status(500).json({ message: err.message });
  }
}



exports.getPeriodInvoices = async (req, res) => {
  try {
    /* -------------------------------------------------------------- */
    /* 1) Permission filter                                           */
    /* -------------------------------------------------------------- */
    const caller = await User.findById(req.user.id)
      .select('createdBy Role')
      .populate({
        path: 'Role',
        select: 'roleName',
        options: { lean: true },
        strictPopulate: false
      })
      .lean();

    let roleName = '';
    const grabName = async (val) => {
      if (!val) return;
      if (typeof val === 'string') { roleName = val; return; }
      if (val.roleName) { roleName = val.roleName; return; }
      if (mongoose.isValidObjectId(val)) {
        const rDoc = await Role.findById(val, 'roleName').lean();
        if (rDoc?.roleName) roleName = rDoc.roleName;
      }
    };
    if (Array.isArray(caller.Role)) {
      for (const r of caller.Role) {
        await grabName(r);
        if (roleName) break;
      }
    } else {
      await grabName(caller.Role);
    }

    const elevatedRoles = ["admin", "ca", "saleanalyst"];
    const isRoot = !caller.createdBy || elevatedRoles.includes(roleName.toLowerCase());

    let filter = {};
    if (!isRoot) {
      const allowed = await getDescendantUserIds(req.user.id);
      filter = { createdBy: { $in: allowed } };
    }

    const us = await User.findById(req.user.id);
    const warehouseIds = us.WarehouseGroup;
    const warehouseFilter = { warehouse: { $in: warehouseIds } };
    const period=req.query.period || "all"
    /* -------------------------------------------------------------- */
    /* 2) Date filter based on req.query.period                       */
    /* -------------------------------------------------------------- */
    const now = new Date();
let start = null;
let end = null;

switch (period) {
  case 'today':
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    break;

  case 'weekly':
    // Sunday start
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);

    // Next Sunday
    end = new Date(start);
    end.setDate(start.getDate() + 7);
    break;

  case 'monthly':
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    break;

  case 'yearly':
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
    break;

  case 'all':
    start = null;
    end = null;
    break;
  case 'All':
    start = null;
    end = null;
    break;

  default:
    throw new Error('Invalid period');
}

// MongoDB filter
let dateFilter = {};
if (start && end) {
  dateFilter = { saleDate: { $gte: start, $lt: end } };
}

     console.log("dateFilter =>", dateFilter);
    /* -------------------------------------------------------------- */
    /* 3) Common populate list                                        */
    /* -------------------------------------------------------------- */
    const pops = [
      { path: "customer", select: "customerName" },
      { path: "warehouse" },
      {
        path: "items.item",
        populate: [
          { path: "category" },
          { path: "subCategory" },
          { path: "subSubCategory" },
          { path: "brand" },
          { path: "tax" },
          { path: "unit" },
        ]
      },
      {
        path: "payments",
        populate: { path: "paymentType", select: "paymentTypeName" }
      },
      {
        path: "createdBy",
        select: "name FirstName LastName role"
      }
    ];

    /* -------------------------------------------------------------- */
    /* 4) Fetch both collections with filters                         */
    /* -------------------------------------------------------------- */
    const [sales, pos] = await Promise.all([
      Sales.find({
        $and: [
          { $or: [filter, warehouseFilter] },
          dateFilter
        ]
      }).populate(pops).lean(),
      PosOrder.find({
        $and: [
          { $or: [filter, warehouseFilter] },
          dateFilter
        ]
      }).populate(pops).lean()
    ]);

    /* -------------------------------------------------------------- */
    /* 5) Payment check                                               */
    /* -------------------------------------------------------------- */
    const paidEnough = (doc, field) =>
      (doc.payments || []).reduce((s, p) => s + (p.amount || 0), 0) >= doc[field]
        ? "Paid"
        : "Unpaid";

    /* -------------------------------------------------------------- */
    /* 6) Merge results                                               */
    /* -------------------------------------------------------------- */
    const unified = [
      ...sales.map(d => ({
        ...d,
        amount: d.grandTotal,
        source: "Sale",
        paymentStatus: paidEnough(d, "grandTotal"),
        creatorName: fullName(d.createdBy)
      })),
      ...pos.map(d => ({
        ...d,
        amount: d.totalAmount,
        source: "POS",
        paymentStatus: paidEnough(d, "totalAmount"),
        creatorName: fullName(d.createdBy)
      }))
    ].sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt));

    return res.json(unified.slice(0, 10));
  } catch (err) {
    console.error("getAllInvoiceCode error:", err);
    return res.status(500).json({ message: err.message });
  }
};
