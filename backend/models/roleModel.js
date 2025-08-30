const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  roleName: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  storeName: { 
    type: String, 
     
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  permissions: [
    {
      module: { 
        type: String, 
        required: true, 
        trim: true 
      },
      actions: { 
        type: [String], 
        required: true, 
        enum: ["Add", "Edit", "Delete", "View"], 
      },
    },
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true }); 

const Role = mongoose.model("Role", RoleSchema);
module.exports = Role;
