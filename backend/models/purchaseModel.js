// models/purchaseModel.js
const mongoose = require("mongoose");

const itemLineSchema = new mongoose.Schema(
  {
    item:         { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    variant:      { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, // only if itemGroup === "Variant"
    quantity:     { type: Number,  required: true },
    purchasePrice:{ type: Number,  required: true },
    salesPrice:   { type: Number,  required: true },
    mrp:          { type: Number },
    unitCost:     { type: Number,  default: 0 },
    discount:     { type: Number,  default: 0 },
    totalAmount:  { type: Number,  required: true },
    expiryDate:   { type: Date },
    reason:       { type: String },
    isRaw:    { type: Boolean, default: false },
    bulkQty:  { type: Number,  default: null },  // e.g. 50
    bulkUnit: { type: String,  default: null },  // "kg", "ltr", …
    bulkCost: { type: Number,  default: null }   // total ₹ for the lot
  },
  { _id: true }           
  
);

const paymentSchema = new mongoose.Schema(
  {
    date:        { type: Date, default: Date.now },
    paymentType: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentType", required: true },
    account:     { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    amount:      { type: Number, required: true },
    paymentNote: { type: String }
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    supplier:  { type: mongoose.Schema.Types.ObjectId, ref: "Supplier",  required: true },

    createdBy:      { type: mongoose.Schema.Types.ObjectId, refPath: "createdByModel" },
    createdByModel: { type: String, required: true, enum: ["User", "Admin"] },

    referenceNo: { type: String, required: true },        // ← no “unique: true” here
    purchaseDate: { type: Date, required: true },

    isReturn: { type: Boolean, default: false },
    status:   { type: String, enum: ["Normal", "Return", "Cancel"], default: "Normal" },

    items:        [itemLineSchema],
    otherCharges: { type: Number, default: 0 },
    discountOnAll:{ type: Number, default: 0 },
    note:         { type: String },

    payments:   [paymentSchema],
    grandTotal: { type: Number, required: true },

    purchaseCode: { type: String, unique: true },
    originalPurchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" }          // auto-generated below
  },
  { timestamps: true }
);

/*───────────────────────────────────────────────
  Auto-generate purchaseCode (PC/ or PR/ + yyyy + rnd)
────────────────────────────────────────────────*/
purchaseSchema.pre("save", function (next) {
  if (!this.purchaseCode) {
    const prefix = this.isReturn ? "PR" : "PC";
    const year   = new Date().getFullYear();
    const rnd    = Math.floor(Math.random() * 9000) + 1000; // 4-digit
    this.purchaseCode = `${prefix}/${year}/${rnd}`;
  }
  next();
});

/*───────────────────────────────────────────────
  INDEXES
────────────────────────────────────────────────*/

// 1️⃣  Ensure only ONE normal purchase per referenceNo
purchaseSchema.index(
  { referenceNo: 1 },
  { unique: true, partialFilterExpression: { isReturn: false } }
);

// 2️⃣  purchaseCode already has “unique: true” in its field definition;
//     Mongoose turns that into { purchaseCode: 1, unique: true }.

/*──────────────────────*/
module.exports = mongoose.model("Purchase", purchaseSchema);
