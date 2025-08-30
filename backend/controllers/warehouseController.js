// controllers/warehouseController.js

const mongoose        = require('mongoose');
const Warehouse       = require('../models/warehouseModel');
const Store           = require('../models/storeModel');
const Account         = require('../models/accountModel');
const StockAdjustment = require('../models/stockAdjustmentModel');
const StockTransfer   = require('../models/stockTransferModel');
const Inventory       = require('../models/inventoryModel');
const Terminal  = require('../models/terminalModel');
const Item = require('../models/itemModel');
const Purchase = require('../models/purchaseModel');
const User            = require('../models/userModel'); 


/**
 * Create a new warehouse.
 * Admins may supply `store`; non-admins are locked to their own.
 * Auto-creates a cash account under the store if none is passed.
 * Supports optional TID and QR upload (via multer → req.file).
 */

exports.createWarehouse = async (req, res) => {
  let autoAcc, autoTerm;

  try {
    /* 1️⃣ INPUT ---------------------------------------------------- */
    const {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      cashAccount: incomingCashAcc,
      terminalId,
      tid: incomingTid,
      store: incomingStore,                // may be null
    } = req.body;

    /* 2️⃣ DETERMINE STORE ----------------------------------------- */
    const role = (req.user.role || '').toLowerCase();
    const myStores = Array.isArray(req.user.stores)
      ? req.user.stores.map(String)
      : req.user.store
        ? [String(req.user.store)]
        : [];

    let storeId;
    if (role === 'admin') {
      storeId = incomingStore;
    } else if (incomingStore) {
      if (!myStores.includes(String(incomingStore))) {
        return res
          .status(403)
          .json({ success: false, message: 'Not your store.' });
      }
      storeId = incomingStore;
    } else {
      storeId = myStores[0];
    }

    if (!storeId)
      return res
        .status(400)
        .json({ success: false, message: 'Store ID is required' });

    /* 3️⃣ GEO ------------------------------------------------------ */
    const location = {
      type:        'Point',
      coordinates: [Number(Longitude), Number(Latitude)],
    };

    /* 4️⃣ CASH ACCOUNT (auto-create if needed) --------------------- */
    let cashAccount = incomingCashAcc;
    if (!cashAccount) {
      const storeDoc = await Store.findById(storeId);
      if (!storeDoc) throw new Error('Invalid store');
      autoAcc = await Account.create({
        parentAccount:  storeDoc.storeAccount,
        accountNumber:  `CASH-${Date.now()}`,
        accountName:    `${warehouseName} Cash`,
        openingBalance: 0,
        note:           '',
        createdBy:      req.user.id,
        createdByModel: role === 'admin' ? 'Admin' : 'User',
      });
      cashAccount = autoAcc._id;
    }

    /* 5️⃣ CREATE WAREHOUSE (no terminal yet) ---------------------- */
    let wh = await Warehouse.create({
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      location,
      cashAccount,
      store: storeId,
      createdBy:      req.user.id,
      createdByModel: role === 'admin' ? 'Admin' : 'User',
    });

    /* 6️⃣ TERMINAL ------------------------------------------------- */
    let term;
    if (terminalId) {
      term = await Terminal.findById(terminalId);
      if (!term) throw new Error('Invalid terminalId');
      term.warehouse = wh._id;
      await term.save();
    } else if (incomingTid) {
      autoTerm = await Terminal.create({
        tid:       incomingTid,
        qrCodePath: req.file ? `/uploads/qr/${req.file.filename}` : null,
        warehouse: wh._id,
        createdBy: req.user.id,
      });
      term = autoTerm;
    }

    wh.terminal = term?._id || null;
    wh.tid      = term?.tid || null;
    wh.qrCode   = term?.qrCodePath || null;
    await wh.save();

    return res.status(201).json({
      success: true,
      message: 'Warehouse created',
      data:    wh,
    });
  } catch (err) {
    /* roll-back helpers */
    if (autoAcc?.id)  await Account.findByIdAndDelete(autoAcc.id).catch(()=>{});
    if (autoTerm?.id) await Terminal.findByIdAndDelete(autoTerm.id).catch(()=>{});
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────
   UPDATE  /api/warehouses/:id   (PUT)
   – only the store-selection logic changed so rules stay identical
────────────────────────────────────────────────────────── */
exports.updateWarehouse = async (req, res) => {
  let autoAcc, autoTerm;

  try {
    /* quick “status” patch left untouched … */

    /* 0️⃣ Extract body ------------------------------------------- */
    const {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      cashAccount: incomingCashAcc,
      terminalId,
      tid: incomingTid,
      store: incomingStore,
    } = req.body;

    /* 1️⃣ Determine store (same policy as create) ---------------- */
    const role = (req.user.role || '').toLowerCase();
    const myStores = Array.isArray(req.user.stores)
      ? req.user.stores.map(String)
      : req.user.store
        ? [String(req.user.store)]
        : [];

    let storeId;
    if (role === 'admin') {
      storeId = incomingStore;
    } else if (incomingStore) {
      if (!myStores.includes(String(incomingStore))) {
        return res
          .status(403)
          .json({ success: false, message: 'Not your store.' });
      }
      storeId = incomingStore;
    } else {
      storeId = myStores[0];
    }

    if (!storeId)
      return res
        .status(400)
        .json({ success: false, message: 'Store ID is required' });

    /* 2️⃣ build updatePayload ----------------------------------- */
    const update = {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      location: { type: 'Point', coordinates: [+Longitude, +Latitude] },
      store: storeId,
    };

    /* 3️⃣ cashAccount creation identical to create() ------------- */
    let cashAccount = incomingCashAcc;
    if (!cashAccount) {
      const storeDoc = await Store.findById(storeId);
      if (!storeDoc) throw new Error('Invalid store');
      autoAcc = await Account.create({
        parentAccount:  storeDoc.storeAccount,
        accountNumber:  `CASH-${Date.now()}`,
        accountName:    `${warehouseName} Cash`,
        openingBalance: 0,
        note:           '',
        createdBy:      req.user.id,
        createdByModel: role === 'admin' ? 'Admin' : 'User',
      });
      cashAccount = autoAcc._id;
    }
    update.cashAccount = cashAccount;

    /* 4️⃣ Update warehouse (excluding terminal) ------------------ */
    let wh = await Warehouse.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!wh)
      return res
        .status(404)
        .json({ success: false, message: 'Warehouse not found' });

    /* 5️⃣ terminal update identical to create() ------------------ */
    let term;
    if (terminalId) {
      term = await Terminal.findById(terminalId);
      if (!term) throw new Error('Invalid terminalId');
      term.warehouse = wh._id;
      await term.save();
    } else if (incomingTid) {
      autoTerm = await Terminal.create({
        tid:       incomingTid,
        qrCodePath: req.file ? `/uploads/qr/${req.file.filename}` : null,
        warehouse: wh._id,
        createdBy: req.user.id,
      });
      term = autoTerm;
    }

    wh.terminal = term?._id || null;
    wh.tid      = term?.tid || null;
    wh.qrCode   = term?.qrCodePath || null;
    await wh.save();

    res.json({ success: true, message: 'Warehouse updated', data: wh });
  } catch (err) {
    if (autoAcc?.id)  await Account.findByIdAndDelete(autoAcc.id).catch(()=>{});
    if (autoTerm?.id) await Terminal.findByIdAndDelete(autoTerm.id).catch(()=>{});
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// controllers/warehouseController.js
// routes: GET /api/warehouses -> getAllWarehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    /* ──────────────────────────────────────────────────────────────
       1) QUICK EXIT: ?scope=mine   → Defaultwarehouse FIRST,
                                    then WarehouseGroup
    ────────────────────────────────────────────────────────────── */
    if ((req.query.scope || '').toLowerCase() === 'mine') {
      const me = await User.findById(req.user.id)
                           .select('Defaultwarehouse WarehouseGroup')
                           .lean();
      if (!me) return res.status(404).json({ success: false, message: 'User not found' });

      const orderedIds = [
        ...(me.Defaultwarehouse ? [String(me.Defaultwarehouse)] : []),
        ...((me.WarehouseGroup || []).map(String))
      ];

      /* 1-B  collect IDs of *my* sub-users (one level deep) */
      const subs = await User.find({ createdBy: req.user.id })
                             .select('_id')
                             .lean();
      const creatorIds = [req.user.id, ...subs.map(u => u._id)];

      /* 1-C  warehouses I (or my subs) created that aren't already listed */
      const mine = await Warehouse.find({
          createdBy: { $in: creatorIds },
          _id: { $nin: orderedIds }
        })
        .select('_id warehouseName store status mobile email tid qrCode cashAccount')
        .populate('cashAccount', 'accountNumber accountName')
        .lean();

      /* 1-D  warehouses explicitly referenced by default/group */
      const refd = orderedIds.length
        ? await Warehouse.find({ _id: { $in: orderedIds } })
                        .select('_id warehouseName store status mobile email tid qrCode cashAccount')
                        .populate('cashAccount', 'accountNumber accountName')
                        .lean()
        : [];

      /* 1-E  discover main warehouses from *all* user stores */
      const storeIds = Array.isArray(req.user.stores)
        ? req.user.stores.filter(Boolean)
        : req.user.store
          ? [req.user.store]
          : [];

      const storeDocs = storeIds.length
        ? await Store.find({ _id: { $in: storeIds } })
                     .select('warehouse')
                     .lean()
        : [];

      const mainIds = new Set(
        storeDocs
          .map(s => s.warehouse?.toString())
          .filter(Boolean)
      );

      /* 1-F  merge + rank + add flag */
      const rank = new Map(orderedIds.map((id, i) => [id, i]));
      const data = [...refd, ...mine]
        .sort((a, b) => (rank.get(String(a._id)) ?? 999) - (rank.get(String(b._id)) ?? 999))
        .map(w => ({
          ...w,
          isRestricted: mainIds.has(w._id.toString())
        }));

      return res.json({ success: true, data });
    }

    /* ──────────────────────────────────────────────────────────────
       2) ORIGINAL LOGIC (with ?storeIds=… and role filtering)
    ────────────────────────────────────────────────────────────── */
    const { storeIds } = req.query;
    const role = String(req.user.role || '').toLowerCase();
    const isAdmin = role === 'admin';

    const creatorStores = Array.isArray(req.user.stores)
      ? req.user.stores.map(String)
      : (req.user.store ? [String(req.user.store)] : []);

    let filter = {};

    if (storeIds) {
      const ids = storeIds.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length) {
        filter.store = isAdmin
          ? { $in: ids }
          : { $in: ids.filter(id => creatorStores.includes(id)) };
      }
    } else if (!isAdmin) {
      filter.store = { $in: creatorStores };
    }
    // (Admin + no storeIds)  → all warehouses

    const warehouses = await Warehouse.find(filter)
      .sort({ warehouseName: 1 })
      .select('_id warehouseName store status mobile email tid qrCode cashAccount')
      .populate('cashAccount', 'accountNumber accountName')
      .lean();

    return res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get one warehouse by ID.
 */
exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse
      .findById(req.params.id)
      .populate('cashAccount', 'accountNumber accountName')
      .populate('store', 'StoreName');
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    return res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a warehouse.
 * Mirrors createWarehouse logic for store override, cashAccount, tid, qrCode and location.
 */
{/*exports.updateWarehouse = async (req, res) => {
  let autoAcc, autoTerm;

  try {
    // ── Quick path for status‐only updates ─────────────────────────────
    if (
      Object.keys(req.body).length === 1 &&
      Object.prototype.hasOwnProperty.call(req.body, "status")
    ) {
      const wh = await Warehouse.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!wh) {
        return res.status(404).json({ success: false, message: "Warehouse not found" });
      }
      return res.json({ success: true, data: wh });
    }

    // ── Full update path ────────────────────────────────────────────────
    // 1) Destructure incoming fields
    const {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      cashAccount: incomingCashAcc,
      terminalId,
      tid: incomingTid,
      store: incomingStore
    } = req.body;

    // 2) Determine storeId
    let storeId;
    if (req.user.role.toLowerCase() === "admin" && incomingStore) {
      storeId = incomingStore;
    } else {
      storeId = Array.isArray(req.user.stores)
        ? req.user.stores[0]
        : req.user.store;
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Store ID is required" });
    }

    // 3) Build update payload (without terminal)
    const updateData = {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      location: { type: "Point", coordinates: [+Longitude, +Latitude] },
      store: storeId
    };

    // 4) Select or auto-create cashAccount
    let cashAccount = incomingCashAcc;
    if (!cashAccount) {
      const store = await Store.findById(storeId);
      if (!store) throw new Error("Invalid store");
      autoAcc = new Account({
        parentAccount: store.storeAccount,
        accountNumber: `CASH-${Date.now()}`,
        accountName: `${warehouseName} Cash`,
        openingBalance: 0,
        note: "",
        createdBy: req.user._id,
        createdByModel:
          req.user.role.toLowerCase() === "admin" ? "Admin" : "User"
      });
      const savedAcc = await autoAcc.save();
      cashAccount = savedAcc._id;
    }
    updateData.cashAccount = cashAccount;

    // 5) Handle optional QR upload
    const qrCodePath = req.file ? `/uploads/qr/${req.file.filename}` : null;

    // 6) Apply update (warehouse without terminal yet)
    let wh = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // 7) Select or auto-create Terminal
    let term;
    if (terminalId) {
      term = await Terminal.findById(terminalId);
      if (!term) throw new Error("Invalid terminalId");
      term.warehouse = wh._id;
      await term.save();
    } else {
      if (!incomingTid) throw new Error("tid is required when no terminalId provided");
      autoTerm = new Terminal({
        tid: incomingTid,
        qrCodePath,
        warehouse: wh._id,
        createdBy: req.user._id
      });
      term = await autoTerm.save();
    }

    // 8) Link terminal back onto warehouse
    wh.terminal = term._id;
    wh.tid      = term.tid;
    wh.qrCode   = term.qrCodePath;
    await wh.save();

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: wh
    });

  } catch (error) {
    // Roll back any auto-created Account or Terminal
    if (autoAcc?.id)  await Account.findByIdAndDelete(autoAcc.id).catch(() => {});
    if (autoTerm?.id) await Terminal.findByIdAndDelete(autoTerm.id).catch(() => {});
    console.error("Error updating warehouse:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};*/}

/**
 * Delete a warehouse.
 */
exports.deleteWarehouse = async (req, res) => {
  try {
    const deleted = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    return res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Find nearby warehouses via geospatial query.
 */
exports.getNearbyWarehouses = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }
    const lat = parseFloat(latitude), lng = parseFloat(longitude);
    const distance = maxDistance ? parseInt(maxDistance) : 5000;

    const warehouses = await Warehouse.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: distance
        }
      }
    });
    return res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching nearby warehouses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get detailed inventory for a warehouse.
 */
// controllers/warehouseController.js
exports.getWarehouseInventory = async (req, res) => {
  try {
    const warehouseId = req.params.id;
    const whOid       = new mongoose.Types.ObjectId(warehouseId);

    // 1) Get every unique item/variant touched by this warehouse
    const ledgerRecords = await Inventory
      .find({ warehouse: whOid })
      .select('item')
      .lean();

    const detailed = [];

    // helper to sum each ledger type for a given itemId
    async function sumsFor(itemId) {
      const [
        [{ totalAdjustment = 0 } = {}],
        [{ totalIn         = 0 } = {}],
        [{ totalOut        = 0 } = {}],
        [{ totalPurchased  = 0 } = {}],
        [{ totalReturned   = 0 } = {}]
      ] = await Promise.all([
        StockAdjustment.aggregate([
          { $match: { warehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalAdjustment: { $sum: '$items.quantity' } } }
        ]),
        StockTransfer.aggregate([
          { $match: { toWarehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalIn: { $sum: '$items.quantity' } } }
        ]),
        StockTransfer.aggregate([
          { $match: { fromWarehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalOut: { $sum: '$items.quantity' } } }
        ]),
        Purchase.aggregate([
          { $match: { warehouse: whOid, isReturn: false } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalPurchased: { $sum: '$items.quantity' } } }
        ]),
        Purchase.aggregate([
          { $match: { warehouse: whOid, isReturn: true } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalReturned: { $sum: '$items.quantity' } } }
        ]),
      ]);
      return { totalAdjustment, totalIn, totalOut, totalPurchased, totalReturned };
    }

    // 2) For each record, load the item/variant and build a row
    for (const { item: iid } of ledgerRecords) {
      // load parent + variantSub if any
      let parent = await Item.findOne({ 'variants._id': iid })
        .populate('variants.variantId', 'variantName')
        .select('itemName description variants warehouse itemGroup')
        .lean();
      let variantSub = null;
      if (parent) {
        variantSub = parent.variants.find(v => v._id.toString() === iid.toString());
      } else {
        parent = await Item.findById(iid)
          .select('itemName sku openingStock description warehouse itemGroup')
          .lean();
      }
      if (!parent) continue;                         // skip if missing
      if (!variantSub && parent.itemGroup === 'Variant') continue; // skip parent record for variants

      // 3) Sum everything
      const {
        totalAdjustment,
        totalIn,
        totalOut,
        totalPurchased,
        totalReturned
      } = await sumsFor(iid);

      // 4) Determine “base” opening
       let opening = 0;
    if (variantSub) {
      // for variants, only their sub-record on this warehouse
      opening = parent.warehouse.toString() === warehouseId
        ? (variantSub.openingStock || 0)
        : 0;
    } else {
      // for non-variants, only the parent if it lives in this warehouse
      opening = parent.warehouse.toString() === warehouseId
        ? (parent.openingStock || 0)
        : 0;
    }

      // 5) Compute current
      const currentStock = opening
                         + totalPurchased
                         - totalReturned
                         + totalAdjustment
                         + totalIn
                         - totalOut;

      // 6) Push row
      if (variantSub) {
        detailed.push({
          itemName:       `${parent.itemName} – ${variantSub.variantId.variantName}`,
          sku:            variantSub.sku,
          description:    parent.description || '',
          openingStock:   opening,
          totalPurchased,
          totalReturned,
          totalAdjustment,
          totalIn,
          totalOut,
          currentStock
        });
      } else {
        detailed.push({
          itemName:       parent.itemName,
          sku:            parent.sku,
          description:    parent.description || '',
          openingStock:   opening,
          totalPurchased,
          totalReturned,
          totalAdjustment,
          totalIn,
          totalOut,
          currentStock
        });
      }
    }

    return res.status(200).json({ success: true, data: detailed });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// controllers/warehouseController.js
exports.getWarehouseList = async (req, res) => {
  try {
    // 1️⃣ build the same store‐scoping filter you use in getAllWarehouses
    let filter = {};
    if (req.user.role.toLowerCase() !== 'admin') {
      const stores = Array.isArray(req.user.stores)
        ? req.user.stores
        : [req.user.store];
      filter.store = { $in: stores };
    }

    // 2️⃣ fetch, sort, and populate both cashAccount & terminal
    const warehouses = await Warehouse.find(filter)
      .sort({ warehouseName: 1 })
      .populate('cashAccount', 'accountNumber accountName')
      .populate('terminal',    'tid qrCodePath');

    // 3️⃣ return them
    return res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching warehouse list:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/warehouseController.js
exports.getWarehouseStockSummary = async (req, res) => {
  try {
    const role = (req.user.role || '').toLowerCase();
    let filter = {};

    // Apply store filter for non-admins
    if (role !== 'admin') {
      const stores = Array.isArray(req.user.stores)
        ? req.user.stores
        : req.user.store
          ? [req.user.store]
          : [];
      filter.store = { $in: stores };
    }

    // Fetch all warehouses for the user
    const warehouses = await Warehouse.find(filter)
      .select('_id')
      .lean();

    const warehouseIds = warehouses.map(w => w._id);

    // Aggregate stock details for each warehouse
    const summaries = await Promise.all(
      warehouseIds.map(async (warehouseId) => {
        const whOid = new mongoose.Types.ObjectId(warehouseId);

        // Get all items associated with this warehouse
        const ledgerRecords = await Inventory
          .find({ warehouse: whOid })
          .select('item')
          .lean();

        let totalItems = 0;
        let totalQuantity = 0;
        let totalWorth = 0;

        for (const { item: iid } of ledgerRecords) {
          // Load item or variant
          let parent = await Item.findOne({ 'variants._id': iid })
            .populate('variants.variantId', 'variantName')
            .select('itemName variants warehouse purchasePrice')
            .lean();
          let variantSub = null;
          if (parent) {
            variantSub = parent.variants.find(v => v._id.toString() === iid.toString());
          } else {
            parent = await Item.findById(iid)
              .select('itemName purchasePrice warehouse')
              .lean();
          }
          if (!parent) continue;
          if (variantSub && parent.itemGroup === 'Variant') {
            // Skip parent record for variants
            if (!variantSub) continue;
          }

          // Calculate stock for this item
          const {
            totalAdjustment,
            totalIn,
            totalOut,
            totalPurchased,
            totalReturned
          } = await sumsFor(iid, whOid); // Reuse the sumsFor helper from getWarehouseInventory

          const opening = variantSub
            ? parent.warehouse.toString() === warehouseId.toString()
              ? (variantSub.openingStock || 0)
              : 0
            : parent.warehouse.toString() === warehouseId.toString()
              ? (parent.openingStock || 0)
              : 0;

          const currentStock = opening
            + totalPurchased
            - totalReturned
            + totalAdjustment
            + totalIn
            - totalOut;

          if (currentStock > 0) {
            totalItems += 1;
            totalQuantity += currentStock;
            const purchasePrice = variantSub ? variantSub.purchasePrice : parent.purchasePrice || 0;
            totalWorth += currentStock * purchasePrice;
          }
        }

        return {
          warehouseId,
          totalItems,
          totalQuantity,
          totalWorth
        };
      })
    );

    return res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    console.error('Error fetching warehouse stock summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reuse the sumsFor helper from getWarehouseInventory
async function sumsFor(itemId, warehouseId) {
  const [
    [{ totalAdjustment = 0 } = {}],
    [{ totalIn = 0 } = {}],
    [{ totalOut = 0 } = {}],
    [{ totalPurchased = 0 } = {}],
    [{ totalReturned = 0 } = {}]
  ] = await Promise.all([
    StockAdjustment.aggregate([
      { $match: { warehouse: warehouseId } },
      { $unwind: '$items' },
      { $match: { 'items.item': itemId } },
      { $group: { _id: null, totalAdjustment: { $sum: '$items.quantity' } } }
    ]),
    StockTransfer.aggregate([
      { $match: { toWarehouse: warehouseId } },
      { $unwind: '$items' },
      { $match: { 'items.item': itemId } },
      { $group: { _id: null, totalIn: { $sum: '$items.quantity' } } }
    ]),
    StockTransfer.aggregate([
      { $match: { fromWarehouse: warehouseId } },
      { $unwind: '$items' },
      { $match: { 'items.item': itemId } },
      { $group: { _id: null, totalOut: { $sum: '$items.quantity' } } }
    ]),
    Purchase.aggregate([
      { $match: { warehouse: warehouseId, isReturn: false } },
      { $unwind: '$items' },
      { $match: { 'items.item': itemId } },
      { $group: { _id: null, totalPurchased: { $sum: '$items.quantity' } } }
    ]),
    Purchase.aggregate([
      { $match: { warehouse: warehouseId, isReturn: true } },
      { $unwind: '$items' },
      { $match: { 'items.item': itemId } },
      { $group: { _id: null, totalReturned: { $sum: '$items.quantity' } } }
    ]),
  ]);
  return { totalAdjustment, totalIn, totalOut, totalPurchased, totalReturned };
}