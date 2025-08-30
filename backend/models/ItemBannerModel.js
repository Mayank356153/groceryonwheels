const mongoose = require("mongoose");



const itemBannerSchema = new mongoose.Schema(
  {   
    item:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"Item", 
       required:[true,"item id is required"]  
    },
    images:{
        type:Array,
        default:[]
    },
    description:{
        type:String
    }             
  },
  { timestamps: true,_id:true }
);



module.exports = mongoose.model("itembanner", itemBannerSchema);