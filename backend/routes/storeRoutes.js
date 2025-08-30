const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Store = require('../models/storeModel');
const Account = require('../models/accountModel');
const Warehouse = require('../models/warehouseModel');
const Terminal = require('../models/terminalModel');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');

router.post(
  '/add/Store',
  authMiddleware,
  hasPermission('Stores', 'Add'),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const {
        StoreCode, StoreName, Mobile, Email, Phone,
        Gst_Number, Tax_Number, Pan_Number,
        Store_website, Bank_details,
        Country, State, City, PostCode, Address,
        Latitude, Longitude,
        storeAccount: incomingAccount,
        autoCreateWarehouse = false,
        warehouse: incomingWarehouseId,
        terminalId,
        tid: incomingTid
      } = req.body;

      // 1) Ensure or auto-create storeAccount
      let storeAccount = incomingAccount;
      if (!storeAccount) {
        const acc = await Account.create([{
          parentAccount: null,
          accountNumber: `STORE-${StoreCode}-${Date.now()}`,
          accountName: `${StoreName} Main`,
          openingBalance: 0,
          note: 'Auto-created for store',
          createdBy: req.user.id,
          createdByModel: req.user.role.toLowerCase() === 'admin' ? 'Admin' : 'User'
        }], { session });
        storeAccount = acc[0]._id;
      }

      // 2) Build geo JSON for store
      let location;
      if (Latitude != null && Longitude != null) {
        location = {
          type: 'Point',
          coordinates: [Number(Longitude), Number(Latitude)]
        };
      }

      // 3) Create the Store
      const newStore = await Store.create([{
        StoreCode, StoreName, Mobile, Email, Phone,
        Gst_Number, Tax_Number, Pan_Number,
        Store_website, Bank_details,
        Country, State, City, PostCode, Address,
        Latitude, Longitude, location,
        storeAccount
      }], { session });
      const savedStore = newStore[0];

      let finalWarehouseId = incomingWarehouseId;

      // 4) Optionally auto-create Warehouse + Terminal
      if (autoCreateWarehouse) {
        // 4a) Make warehouse using same storeAccount as cashAccount
        const whArr = await Warehouse.create([{
          warehouseName: StoreName,
          mobile: Mobile,
          email: Email,
          cashAccount: storeAccount,
          store: savedStore._id,
          location: Latitude != null && Longitude != null ? {
            type: 'Point',
            coordinates: [Number(Longitude), Number(Latitude)]
          } : undefined
        }], { session });
        const wh = whArr[0];

        // 4b) Attach or auto-create Terminal
        let term;
        if (terminalId) {
          term = await Terminal.findById(terminalId).session(session);
          if (!term) throw new Error('Invalid terminalId');
          term.warehouse = wh._id;
          await term.save({ session });
        } else {
          if (!incomingTid) throw new Error('tid is required when auto-creating terminal');
          const tArr = await Terminal.create([{
            tid: incomingTid,
            warehouse: wh._id,
            createdBy: req.user.id
          }], { session });
          term = tArr[0];
        }

        // 4c) Link Terminal on Warehouse
        wh.terminal = term._id;
        wh.tid = term.tid;
        await wh.save({ session });

        finalWarehouseId = wh._id;
      }

      // 5) If we now have a warehouse, link it back on the Store
      if (finalWarehouseId) {
        savedStore.warehouse = finalWarehouseId;
        await savedStore.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({ success: true, store: savedStore });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error creating store:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// routes/storeRoutes.js  (your file above)
router.get(
  '/add/store',
  authMiddleware,
  hasPermission('Stores', 'View'),
  async (req, res) => {
    try {
      // ---- derive allowed ids from the JWT ----
      const rawIds = Array.isArray(req.user?.stores) ? req.user.stores : [];
      const allowedIds = rawIds
        .filter(Boolean)
        .map(id => new mongoose.Types.ObjectId(String(id)));

      // 1) base query: restrict to allowed stores (if any listed)
      let criteria = {};
      if (allowedIds.length) {
        criteria._id = { $in: allowedIds };
      }

      // 2) optional geospatial filter
      if (req.query.latitude && req.query.longitude) {
        const lat = parseFloat(req.query.latitude);
        const lng = parseFloat(req.query.longitude);
        const maxDistance = parseInt(req.query.maxDistance, 10) || 5000;

        criteria.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistance
          }
        };
      }

      const result = await Store.find(criteria)
        .populate('storeAccount', 'accountNumber accountName')
        .exec();

      return res.status(200).json({
        success: true,
        message: 'Data Fetched Successfully',
        result
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Internal Server Error', err });
    }
  }
);


// ─── GET single Store by ID ─────────────────────────────────────────────────
router.get(
  '/store/:id',
  authMiddleware,
  hasPermission('Stores','View'),
  async (req, res) => {
    try {
      const store = await Store.findById(req.params.id)
        .populate('storeAccount','accountNumber accountName')
        .populate('warehouse','warehouseName tid');
      if (!store) {
        return res.status(404).json({ success:false, message:'Store not found' });
      }
      return res.status(200).json({ success:true, result: store });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success:false, message:'Internal server error' });
    }
  }
);

// ─── UPDATE a Store ─────────────────────────────────────────────────────────
router.put(
  '/store/:id',
  authMiddleware,
  hasPermission('Stores','Edit'),
  async (req, res) => {
    try {
      const {
        StoreCode, StoreName, Mobile, Email, Phone,
        Gst_Number, Tax_Number, Pan_Number,
        Store_website, Bank_details,
        Country, State, City, PostCode, Address,
        Latitude, Longitude,
        storeAccount, warehouse
      } = req.body;

      let location;
      if (Latitude!=null && Longitude!=null) {
        location = { type:'Point', coordinates:[ Number(Longitude), Number(Latitude)] };
      }

      const updated = await Store.findByIdAndUpdate(
        req.params.id,
        {
          StoreCode, StoreName, Mobile, Email, Phone,
          Gst_Number, Tax_Number, Pan_Number,
          Store_website, Bank_details,
          Country, State, City, PostCode, Address,
          Latitude, Longitude, location,
          storeAccount, warehouse
        },
        { new:true }
      );
      if (!updated) {
        return res.status(404).json({ success:false, message:'Store not found' });
      }
      return res.status(200).json({ success:true, store: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success:false, message:'Internal server error' });
    }
  }
);

// ─── DELETE a Store ─────────────────────────────────────────────────────────
router.delete(
  '/store/:id',
  authMiddleware,
  hasPermission('Stores','Delete'),
  async (req, res) => {
    try {
      const deleted = await Store.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success:false, message:'Store not found' });
      }
      return res.status(200).json({ success:true, message:'Store deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success:false, message:'Internal server error' });
    }
  }
);

/* ==================== SYSTEM ZONE ROUTES ==================== */

// CREATE a new System Zone
router.post("/add/systemzone", authMiddleware, hasPermission("systemzone", "Add"), async (req, res) => {
  try {
    const {
      Timezone,
      Dateformat,
      TimeFormat,
      Currency,
      CurrencySymbolPlacement,
      Decimals,
      DecimalforQuantity,
      Language,
    } = req.body;
    
    const newSystemZone = new storeSystem({
      Timezone,
      Dateformat,
      TimeFormat,
      Currency,
      CurrencySymbolPlacement,
      Decimals,
      DecimalforQuantity,
      Language,
    });
    
    const data = await newSystemZone.save();
    res.status(200).json({ message: "Data saved successfully", data });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// UPDATE a System Zone by ID
router.put("/systemzone/:id", authMiddleware, hasPermission("systemzone", "Edit"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Timezone,
      Dateformat,
      TimeFormat,
      Currency,
      CurrencySymbolPlacement,
      Decimals,
      DecimalforQuantity,
      Language,
    } = req.body;
    
    const updatedSystemZone = await storeSystem.findByIdAndUpdate(
      id,
      {
        Timezone,
        Dateformat,
        TimeFormat,
        Currency,
        CurrencySymbolPlacement,
        Decimals,
        DecimalforQuantity,
        Language,
      },
      { new: true }
    );
    
    if (!updatedSystemZone) {
      return res.status(404).json({ message: "System Zone not found" });
    }
    
    res.status(200).json({ message: "System Zone updated successfully", data: updatedSystemZone });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// DELETE a System Zone by ID
router.delete("/systemzone/:id", authMiddleware, hasPermission("systemzone", "Delete"), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSystemZone = await storeSystem.findByIdAndDelete(id);
    if (!deletedSystemZone) {
      return res.status(404).json({ message: "System Zone not found" });
    }
    res.status(200).json({ message: "System Zone deleted successfully", data: deletedSystemZone });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
