// controllers/terminalController.js

const Terminal  = require('../models/terminalModel');
const Warehouse = require('../models/warehouseModel');


exports.getTerminals = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role.toLowerCase() !== 'admin') {
      const userStores = Array.isArray(req.user.stores)
        ? req.user.stores
        : [req.user.store];

      // find all warehouse IDs in those stores
      const whs = await Warehouse.find(
        { store: { $in: userStores } },
        '_id'
      ).lean();
      const whIds = whs.map(w => w._id);

      // allow warehouse=null (unassigned) or those in our store
      filter = {
        $or: [
          { warehouse: null },
          { warehouse: { $in: whIds } }
        ]
      };
    }

    const terms = await Terminal.find(filter)
      .select('_id tid qrCodePath warehouse createdBy')
      .lean();

    return res.json({ success: true, data: terms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, message: err.message });
  }
};


exports.createTerminal = async (req, res) => {
  try {
    const { tid, warehouse: incomingWarehouseId } = req.body;
    if (!tid) {
      return res.status(400).json({ success:false, message: 'tid is required' });
    }

    // handle file
    const qrCodePath = req.file
      ? `/uploads/qr/${req.file.filename}`
      : '';

    let warehouseId = null;
    if (incomingWarehouseId) {
      // validate warehouse exists
      const wh = await Warehouse.findById(incomingWarehouseId);
      if (!wh) {
        return res.status(400).json({ success:false, message:'Invalid warehouse ID' });
      }
      // enforce store-scope for non-admins
      if (req.user.role.toLowerCase() !== 'admin') {
        const userStores = Array.isArray(req.user.stores)
          ? req.user.stores
          : [req.user.store];
        if (!userStores.map(String).includes(String(wh.store))) {
          return res.status(403).json({ success:false, message:'Access denied' });
        }
      }
      warehouseId = incomingWarehouseId;
    }

    const term = await Terminal.create({
      tid,
      qrCodePath,
      warehouse: warehouseId,
      createdBy: req.user.id
    });

    return res.status(201).json({ success:true, data: term });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, message: err.message });
  }
};


exports.updateTerminal = async (req, res) => {
  try {
    const { tid, warehouse: incomingWarehouseId } = req.body;
    const term = await Terminal.findById(req.params.id);
    if (!term) return res.status(404).json({ success:false, message:'Not found' });

    // if changing warehouse, validate + store-scope
    if (incomingWarehouseId) {
      const wh = await Warehouse.findById(incomingWarehouseId);
      if (!wh) return res.status(400).json({ success:false, message:'Invalid warehouse' });
      if (req.user.role.toLowerCase() !== 'admin') {
        const userStores = Array.isArray(req.user.stores)
          ? req.user.stores
          : [req.user.store];
        if (!userStores.map(String).includes(String(wh.store))) {
          return res.status(403).json({ success:false, message:'Access denied' });
        }
      }
      term.warehouse = incomingWarehouseId;
    }

    if (tid)           term.tid        = tid;
    if (req.file)      term.qrCodePath = `/uploads/qr/${req.file.filename}`;
    await term.save();

    return res.json({ success:true, data: term });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, message: err.message });
  }
};


exports.deleteTerminal = async (req, res) => {
  try {
    const term = await Terminal.findById(req.params.id);
    if (!term) return res.status(404).json({ success:false, message:'Not found' });

    // if assigned, enforce store-scope
    if (term.warehouse && req.user.role.toLowerCase() !== 'admin') {
      const wh = await Warehouse.findById(term.warehouse);
      const userStores = Array.isArray(req.user.stores)
        ? req.user.stores
        : [req.user.store];
      if (!userStores.map(String).includes(String(wh.store))) {
        return res.status(403).json({ success:false, message:'Access denied' });
      }
    }

    await term.remove();
    return res.json({ success:true, message:'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, message: err.message });
  }
};
