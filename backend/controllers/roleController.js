// controllers/roleController.js

const Role = require('../models/roleModel');

/**
 * POST /roles
 * Anyone with permission can create a role.
 * We record who created it via req.user.id.
 */
exports.createRole = async (req, res) => {
  try {
    const { roleName, description, permissions } = req.body;

    // Basic validation
    if (!roleName || !Array.isArray(permissions) || permissions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'roleName and at least one permission are required' });
    }

    // Build and save
    const newRole = new Role({
      roleName,
      description,
      permissions,
      createdBy: req.user.id
    });
    await newRole.save();

    return res.status(201).json({ success: true, role: newRole });
  } catch (error) {
    console.error('Error creating role:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /roles
 * - Admins see all roles.
 * - Others see only roles they created.
 */
exports.getRoles = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role.toLowerCase() !== 'admin') {
      filter.createdBy = req.user.id;
    }
    const roles = await Role.find(filter);
    return res.status(200).json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /roles/:id
 * - Admins may update any role.
 * - Others may update only roles they created.
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleName, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Scope check
    if (
      req.user.role.toLowerCase() !== 'admin' &&
      role.createdBy.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only update roles you created' });
    }

    // Apply updates
    if (roleName !== undefined)    role.roleName    = roleName;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();
    return res
      .status(200)
      .json({ success: true, message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /roles/:id
 * - Admins may delete any role.
 * - Others may delete only roles they created.
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Scope check
    if (
      req.user.role.toLowerCase() !== 'admin' &&
      role.createdBy.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only delete roles you created' });
    }

    await role.remove();
    return res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
