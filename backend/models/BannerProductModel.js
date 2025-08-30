const mongoose = require("mongoose");
const ItemSchema=new mongoose.Schema({
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
    type:String,
    // required:[true, "item description is required"]
   },
   price:{
    type:Number,
    required:true,
    default:0
   },
   discountType:{
    type:String,
    enum:["Fixed","Percentage"],
    default:"Fixed"
   },
   discount:{
    type:Number,
    default:0
   }
},{_id:false})


const bannerProductSchema = new mongoose.Schema(
  {       bannerType:{
                            type:String,
                            enum:["SingleProduct","MultiProduct","TopRatedProduct","MostBuying"],
                            default:"SingleProduct"
                     },
           items:[ItemSchema] ,
           path:{
            type:String,
            required:[true,"banner image path is required"]
           },         
  },
  { timestamps: true,_id:true }
);



module.exports = mongoose.model("bannerproduct", bannerProductSchema);