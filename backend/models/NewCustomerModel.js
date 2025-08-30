const mongoose = require("mongoose");

const newCustomerSchema = new mongoose.Schema({
 customerName:{
    type:String
 },
 mobile:{
    type:String
 },
 locationLink:{
    type:String
 },
 state:{
    type:String
 },
 country:{
    type:String
 },
 sector:{
    type:String
 },
 houseNo:{
    type:String
 },
 address:{
    type:String
 },
 type:{
    type:String,
    enum:["Online","Offline"]
 },
 attachment:{
    type:String
 }
}, { timestamps: true });

module.exports = mongoose.model("NewCustomer", newCustomerSchema);
