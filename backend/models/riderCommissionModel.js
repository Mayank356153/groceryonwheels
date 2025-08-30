const mongoose=require("mongoose")

const moneyBreakdownSchema=new mongoose.Schema({
    reason:{
        type:String,
        required:[true,"reason for amount is required"]
    },
    amount:{
        type:Number,
        required:[true,"amount is required"]
    }
},{

    _id:false
})

const ridercommissionSchema=new mongoose.Schema({
    storeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Store"
    },
    totalAmount:{
        type:Number,
        required:[true,"total amount to be paid to rider is required"]
    },
    moneyBreakdown:[moneyBreakdownSchema]
},{
    timestamps:true,
    _id:true
})

module.exports=mongoose.model("RiderCommission",ridercommissionSchema)