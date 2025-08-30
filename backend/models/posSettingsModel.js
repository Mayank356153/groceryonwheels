const mongoose = require("mongoose");

const posSettingsSchema = new mongoose.Schema({
  // Example fields based on your screenshot:
  defaultAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account", // assuming your account model is named "Account"
    default: null,
  },
  
  defaultSaleDiscount: { type: Number, default: 0 },

  salesInvoiceFormat: { type: String, default: "Default" },
  posInvoiceFormat: { type: String, default: "Default" },
  showWHColumnsOnPOSInvoice: { type: Boolean, default: false },
  showPaidAmountAndChangeReturnOnInvoice: { type: Boolean, default: false },
  showPreviousBalanceOnInvoice: { type: Boolean, default: false },
  numberToWordsFormat: { type: String, default: "Default" },
  invoiceFooterText: { type: String, default: "" },
  invoiceTermsAndConditions: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("PosSettings", posSettingsSchema);

