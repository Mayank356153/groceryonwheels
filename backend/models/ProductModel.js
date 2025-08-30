const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
      productId:{
        type:String,
        required:[true,"Product Id is required"],
        unique:[true,"Product id should be unique"]
      },
      description:{
        type:String
      },
      media:{
        type:[String],
        default:[]
      },
      brands:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Brand"
      }
  },
  { timestamps: true ,_id:true}
);

module.exports = mongoose.model("Product", ProductSchema);