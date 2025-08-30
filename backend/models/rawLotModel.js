const mongoose = require("mongoose");

const rawLotSchema = new mongoose.Schema(
  {
    // purchase linkage
    purchaseId  : { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
    purchaseItem: { type: mongoose.Schema.Types.ObjectId, required: true },

    // product & location
    item     : { type: mongoose.Schema.Types.ObjectId, ref: "Item",      required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },

    // bulk details (captured on the Purchase form)
    bulkQty : { type: Number,  required: true },     // e.g. 50
    bulkUnit: { type: String,  default: "kg" },
    bulkCost: { type: Number,  required: true },     // total ₹

    /* ---------- packing ----------- */
    packSize : { type: Number,  default: null },     // e.g. 1 kg per pack
    packedQty: { type: Number,  default: 0   },      // bulk units *already packed*
                                                   // (auto-updated by PATCH /pack)
    //unitCost : { type: Number,  default: null },     // auto-calc
    packCost : { type: Number,  default: null },     // auto-calc
    salesPrice: { type: Number, default: 0 },
    isPacked : { type: Boolean, default: false },     // true once everything is packed
    totalPacksMade: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* derive unitCost whenever bulkQty or bulkCost changes */
rawLotSchema.pre("save", function (next) {
  if (this.packSize != null && (this.packCost == null || this.packCost <= 0)) {
    return next(new Error("packCost must be provided and greater than 0 when packSize is defined"));
  }
  next();
});

module.exports = mongoose.model("RawLot", rawLotSchema);
