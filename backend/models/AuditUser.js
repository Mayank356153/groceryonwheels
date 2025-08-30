const mongoose = require("mongoose"); // Import mongoose library

// Define schema for an audit user
const user = mongoose.Schema({
  userName: {
    type: String,
    required: ["true", "Audit username is required"], // Field is required
    trim: true, // Trims leading/trailing whitespace
    unique: [true, "audit username should be true"] // Must be unique
  },
  password: {
    type: String,
    required: [true, "Audit password is required"] // Field is required
  },
  employeeId: {
    type: String // Optional employee identifier
  },
  auditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Audit" // References the related Audit document
  }
});

// Create model named "AuditUser" from the schema
const User = mongoose.model("AuditUser", user);

// Export the model for use in other files
module.exports = User;
