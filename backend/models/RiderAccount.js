const mongoose=require("mongoose")

const RiderAccountSchema= mongoose.Schema({
    accountNumber:{
        type:String,
        unique:true,
        required:[true,"Account Number is required"]
    },
    openingBalance:{
        type:Number,
        default:0
    },
    totalOrderSale:{
        type:Number,
        default:0
    },
    cashSale:{
        type:Number,
        default:0
    },
    bankSale:{
        type:Number,
        default:0
    },
    moneyTransfer:{
        type:Number,
        default:0
    },
    currentBalance:{
        type:Number,
        default:0
    },
},{timeStamp:true,_id:true})


module.exports = mongoose.model("RiderAccount", RiderAccountSchema);
