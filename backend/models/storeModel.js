const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  StoreCode: { type: String },
  StoreName: { type: String },
  Mobile: { type: String },
  Email: { type: String },
  Phone: { type: Number },
  Gst_Number: { type: String },
  Tax_Number: { type: String },
  Pan_Number: { type: String },
  Store_website: { type: String },
  Bank_details: { type: String },
  Country: { type: String },
  State: { type: String },
  City: { type: String },
  PostCode: { type: String },
  Address: { type: String },
 
  Latitude: { type: Number },
  Longitude: { type: Number },
  
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number] 
    }
  },
  Timezone: { type: String },
  Dateformat: { type: String },
  TimeFormat: { type: String },
  Currency: { type: String },
  CurrencySymbolPlacement: { type: String },
  Decimals: { type: String },
  DecimalforQuantity: { type: String },
  Language: { type: String },
  
  
  storeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },   // auto-created if missing
  warehouse:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }, // new
}, { timestamps: true });



storeSchema.pre("save", function (next) {
  if (
    (!this.location || !this.location.coordinates || this.location.coordinates.length === 0) &&
    this.Latitude != null &&
    this.Longitude != null
  ) {
    this.location = {
      type: "Point",
      coordinates: [this.Longitude, this.Latitude] 
    };
  }
  next();
});


storeSchema.index({ location: "2dsphere" });

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;
