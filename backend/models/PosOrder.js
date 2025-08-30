const mongoose = require("mongoose");
const { getNextSequence, formatCode } = require("../utils/sequence");

const PosOrderSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    customer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "customerModel"
  },
  customerModel: {
    type: String,
    required: true,
    enum: ["CustomerData", "Customer"]
  },

  // ← link back to the van‐booking (optional)
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VanBooking",
    required: false
  },
     createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "createdByModel",
    
  },
  createdByModel: {
    type: String,
    enum: ["User", "Admin"],
    
  },
    saleCode: { type: String, unique: true },
    invoiceCount: {
      type: Number,
      default: 0,
    },
    previousBalance: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: "",
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    changeReturn: {
      type: Number,
      default: 0,
    },
    advanceUsed: {
      type: Number,
      default: 0,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
        },
        rawLot: { type: mongoose.Schema.Types.ObjectId, ref: "RawLot" },
        packSize: Number,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        unit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Unit",
        },
        tax: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    payments: [
      {
        paymentType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PaymentType",
          required: true,
        },
        terminal: { type: mongoose.Schema.Types.ObjectId, ref: "Terminal" },
        amount: { type: Number, required: true },
        paymentCode: { type: String },
        paymentDate: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["OnHold", "Pending", "Completed"],
      default: "Pending",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    location:{
       type:[],
       default:[]
    },
    additionalPayment:[{
      note: { type: String, required: true },
      amount:{type:Number,required:true},
    }],
    additionalCharges:{type:Number,default:0}
  },
  { timestamps: true }
);

// PRE-SAVE HOOK: generate invoiceCode on creation
PosOrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const seq = await getNextSequence("saleCode");
    this.saleCode = formatCode("SL", seq);
  }
  next();
});

module.exports = mongoose.model("PosOrder", PosOrderSchema);