const mongoose = require("mongoose") // Import mongoose library


// Main Audit schema
const auditPersonSchema = new mongoose.Schema({
   username:{
       type: String,
       unique: [true, "username should be unique"], // Ensure usernames are unique
       required: [true, "username is required"] // Required field
   },
   password: {
       type: String,
       required: [true, "password is required"] // Required field
   },
   auditId:{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Audit" // Reference to the associated audit
   },
   employeeId:{
    type:String,
   }
}, { timestamps: true, _id: true }) // Adds createdAt/updatedAt and enables _id

// Export the Audit model
module.exports = mongoose.model("AuditPerson", auditPersonSchema)
