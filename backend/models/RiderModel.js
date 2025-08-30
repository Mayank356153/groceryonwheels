const mongoose = require("mongoose");



const RiderTranscationSchema=new mongoose.Schema({
   transcationId:{
      type:String,
      // required:[true,"Transcation id is required"],
      unique:[true,"Transcation id should be unique"],
   },
   amount:{
      type:Number,
      default:0
   },
   type:{
      type:String,
      enum:["Deposit","Money Transfer","Cash Transcation","Bank Transcation","Opening Balance"]
   },
   format:{
      type:String,
      enum:["Credited","Debited"]
   }
},{timestamps:true,id:false})

const RatingSchema= new mongoose.Schema({
    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"CustomerData"
    },
    description:{
        type:String
    },
    likes:{
        type:Number,
        max:5,
        min:1
    }
},{_id:false})


const riderSchema = new mongoose.Schema({
 username:{
    type:String,
    required:[true,"username is rerquired"],
    unique:[true,"username should be unique"]
 },

 orderId:{
   type:[mongoose.Schema.Types.ObjectId],
   ref:"Order"
 },
 riderRating:[RatingSchema],
 riderAccount:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"RiderAccount",
      required:[true,"Rider Account Number"]
 },

 RiderTranscation:{
        type:[RiderTranscationSchema]
 },

 slot:{
   type:mongoose.Schema.Types.ObjectId,
   ref:"DeliverySlot"
 },

 firstname:{
    type:String,
    required:[true,"first name is required"]
 },
 lastname:{
    type:String
 },
 mobile:{
    type:String,
    required:[true,"mobile number is required"]
 },
 email:{
    type:String
 },
 role:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Role",
    required:[true,"Role is required"]
 },
 password:{
    type:String,
    required:[true,"Password is required"]
 },
 store:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Store",
    required:[true,"store is required"]
 },
 status:{
    type:String,
    enum:["Active","Inactive"],
    required:[true,"status is required"]
 },

 bankAccountNumber:{
    type:String,
    required:[true,"bankAccountNumber is required"],
    unique:true
 },
 ifscCode:{
    type:String,
    required:[true,"ifsc code is required"],
 },
 bankName:{
    type:String,
    required:[true,"Bank name is required"]
 },
 addharCardImage:{
  type:[String],
  required:[true,"Addhar card image is required"]
 },
 addharCardNumber:{
    type:String,
    required:[true,"Addhar card number is required"],
    unique:[true,"addhar card number should be unique"]
   },
   panCardImage:{
    type:[String],
    required:[true,"Pancard image is required"]
   },
   panCardNumber:{
    type:String,
    required:[true,"Pancard number is required"]
   },
   drivingLicenseImage:{
    type:[String],
    required:[true,"Driving License image is required"]
   },
   drivingLicenseNumber:{
    type:String,
    required:[true,"Driving License image is required"]
   },
   profileImage:{
      type:[String]
   }
}, { timestamps: true });

module.exports = mongoose.model("Rider", riderSchema);
