const mongoose = require("mongoose") // Import mongoose library



// Main Audit schema
const auditSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // User who initiated the audit
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store" // Associated store for the audit
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse" // Associated warehouse
    },
    items:[{
         itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item" // References the Item being audited
            },
            itemName:{
               type:String
            },
            expectedQty: Number, // Quantity expected from system
            scannedQty: Number, // Quantity actually scanned
    }],
    open: {
        type: Boolean,
        default: true // Indicates whether the audit is still active
    },
    partial:{
        type:Boolean,
        default:false,
    }
}, { timestamps: true, _id: true }) // Adds createdAt/updatedAt and enables _id

// Export the Audit model
module.exports = mongoose.model("Audit", auditSchema)
