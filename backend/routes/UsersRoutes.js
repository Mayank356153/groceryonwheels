// routes/userRoutes.js

const express           = require('express');
const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const User              = require('../models/userModel');
const Role              = require('../models/roleModel');
const Warehouse         = require('../models/warehouseModel');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /adduserbyadmin
// POST /adduserbyadmin
router.post(
  '/adduserbyadmin',
  authMiddleware,
  hasPermission('users', 'Add'),
  async (req, res) => {
    try {
      const {
        userName,
        FirstName,
        LastName,
        Mobile,
        Email,
        Store: incomingStores,
        Role: newUserRole,
        Password,
        WarehouseGroup: rawWhIds = [],
        Defaultwarehouse: rawDefaultWh,
        status
      } = req.body;

      // 0) Normalize
      const emailNorm = (Email || '').trim().toLowerCase();

      // 1) Basic field presence
      if (!userName || !FirstName || !LastName || !Mobile || !emailNorm || !Password || !newUserRole) {
        return res.status(400).json({ field: 'general', message: 'Missing required fields' });
      }
      if (!status) {
        return res.status(400).json({ field: 'status', message: 'Status is required' });
      }
      const statusNorm = String(status).toLowerCase();
      if (!['active', 'inactive'].includes(statusNorm)) {
        return res.status(400).json({ field: 'status', message: 'Invalid status' });
      }
      if (await User.findOne({ Email: emailNorm })) {
        return res.status(400).json({ field: 'Email', message: 'User already exists' });
      }

      // 2) Hash password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // 3) Determine creator role + store scope
      const roleStr = typeof req.user.role === 'string' ? req.user.role.toLowerCase() : '';
      const creatorStores = Array.isArray(req.user.stores) ? req.user.stores.map(String) : [];
      const incoming = Array.isArray(incomingStores)
        ? incomingStores.filter(Boolean).map(String)
        : (incomingStores ? [String(incomingStores)] : []);

      let assignedStores;
      if (roleStr === 'admin') {
        assignedStores = incoming;
      } else {
        assignedStores = (incoming.length
          ? incoming.filter(id => creatorStores.includes(id))
          : creatorStores);
      }

      // 4) Enforce: at least one store (for everyone, incl. admin)
      if (!assignedStores.length) {
        return res.status(400).json({ field: 'Store', message: 'At least one Store is required' });
      }

      // 5) Warehouses: shape + must belong to assigned stores
      const whIds = Array.isArray(rawWhIds) ? rawWhIds : (rawWhIds ? [rawWhIds] : []);
      if (!whIds.length) {
        return res.status(400).json({ field: 'WarehouseGroup', message: 'Select one or more Warehouses' });
      }

      const validWarehouses = await Warehouse.find({
        _id: { $in: whIds },
        store: { $in: assignedStores }
      }).distinct('_id');

      if (!validWarehouses.length || validWarehouses.length !== whIds.length) {
        return res.status(400).json({
          field: 'WarehouseGroup',
          message: 'Selected warehouses must belong to the chosen store(s)'
        });
      }

      // 6) Default warehouse: required + must be in group
      if (!rawDefaultWh) {
        return res.status(400).json({ field: 'Defaultwarehouse', message: 'Default Warehouse is required' });
      }
      if (!validWarehouses.map(String).includes(String(rawDefaultWh))) {
        return res.status(400).json({
          field: 'Defaultwarehouse',
          message: 'Default must be one of the selected warehouses'
        });
      }

      // 7) Create
      const newUser = new User({
        userName,
        FirstName,
        LastName,
        Mobile,
        Email: emailNorm,
        Role: newUserRole,
        Password: hashedPassword,
        createdBy: req.user.id,
        Store: assignedStores,
        WarehouseGroup: validWarehouses,
        Defaultwarehouse: rawDefaultWh,
        status: statusNorm
      });

      await newUser.save();
      return res.status(201).json({ message: 'User added successfully' });
    } catch (err) {
      console.error('Error adding user:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);


// POST /userlogin
router.post('/userlogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and Password are required' });
    }

    const user = await User.findOne({ Email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    if (!user.Password || !(await bcrypt.compare(password, user.Password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.Role, stores: user.Store || [] },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const roleData = await Role.findById(user.Role);

    return res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        Role: user.Role,
        stores   : user.Store || []  
      },
      permissions: roleData?.permissions || []
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


//POST /userloginByUserName
router.post('/userloginByUserName', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and Password are required' });
    }
    console.log('Login attempt for:', username);

    const user = await User.findOne({ userName: username });
    console.log('Found user:', user);
    
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    if (!user.Password || !(await bcrypt.compare(password, user.Password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.Role, stores: user.Store || [] },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const roleData = await Role.findById(user.Role);

    return res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        Role: user.Role,
        defaultWarehouse: user.Defaultwarehouse || null,
      },
      permissions: roleData?.permissions || []
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});




// GET /userlist
router.get('/userlist', authMiddleware, async (req, res) => {
  try {
    let users;
    if (req.user.role.toLowerCase() === 'admin') {
      users = await User.find().populate('Store', 'StoreName');
    } else {
      users = await User.find({ createdBy: req.user.id }).populate('Store', 'StoreName');
    }
    return res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(400).json({ message: 'Error fetching users', error: err.message });
  }
});

// GET /profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    .populate('Store', 'StoreName')
    .populate('Role', 'roleName');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roleName = user.Role.roleName.toLowerCase();

    return res.status(200).json({
      name:      `${user.FirstName} ${user.LastName}`,
      role:      roleName,  
      storeName: roleName === 'admin'
                    ? 'Admin Panel'
                    : user.Store?.[0]?.StoreName || 'Store',
      defaultWarehouse: user.Defaultwarehouse || null,
      warehouses: user.WarehouseGroup || [],
    });
  } catch (e) {
    console.error('Profile Error:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
});

router.patch(
  '/:id/status',
  authMiddleware,
  hasPermission('users', 'Edit'),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id.trim(),
        { status },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'Status updated', user: updatedUser });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// PUT /:id (update user)
router.put(
  '/:id',
  authMiddleware,
  hasPermission('users', 'Edit'),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

// Normalize arrays
const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);

if (updateData.status) {
  const st = String(updateData.status).toLowerCase();
  if (!['active', 'inactive'].includes(st)) {
    return res.status(400).json({ field: 'status', message: 'Invalid status' });
  }
}

// Validate store presence when stores are changing
if ('Store' in updateData) {
  const stores = toArray(updateData.Store).map(String);
  if (!stores.length) {
    return res.status(400).json({ field: 'Store', message: 'At least one Store is required' });
  }
}

// If WarehouseGroup/Defaultwarehouse provided, validate relationship
if ('WarehouseGroup' in updateData || 'Defaultwarehouse' in updateData || 'Store' in updateData) {
  const stores = ('Store' in updateData) ? toArray(updateData.Store) : undefined;

  // If stores are not changing, read existing user to know store scope
  const current = await User.findById(req.params.id).lean();
  const effectiveStores = stores?.length ? stores : (current?.Store || []);

  const groupIds = ('WarehouseGroup' in updateData)
    ? toArray(updateData.WarehouseGroup)
    : (current?.WarehouseGroup || []);

  // Warehouses must belong to effective stores
  const validWhIds = await Warehouse.find({
    _id: { $in: groupIds },
    store: { $in: effectiveStores }
  }).distinct('_id');

  if (!groupIds.length) {
    return res.status(400).json({ field: 'WarehouseGroup', message: 'Select one or more Warehouses' });
  }
  if (validWhIds.length !== groupIds.length) {
    return res.status(400).json({ field: 'WarehouseGroup', message: 'Warehouses must belong to chosen store(s)' });
  }

  // Default must be in group
  const defaultWh = ('Defaultwarehouse' in updateData)
    ? updateData.Defaultwarehouse
    : current?.Defaultwarehouse;

  if (!defaultWh) {
    return res.status(400).json({ field: 'Defaultwarehouse', message: 'Default Warehouse is required' });
  }
  if (!validWhIds.map(String).includes(String(defaultWh))) {
    return res.status(400).json({ field: 'Defaultwarehouse', message: 'Default must be one of the selected warehouses' });
  }
}
      if (updateData.Password) {
        updateData.Password = await bcrypt.hash(updateData.Password, 10);
      }
      // Validate status
      
      const updatedUser = await User.findByIdAndUpdate(req.params.id.trim(), updateData, {
        new: true
      });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// DELETE /:id (delete user)
router.delete(
  '/:id',
  authMiddleware,
  hasPermission('users', 'Delete'),
  async (req, res) => {
    try {
      const deleted = await User.findByIdAndDelete(req.params.id.trim());
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
