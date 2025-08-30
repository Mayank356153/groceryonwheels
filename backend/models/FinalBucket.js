const mongoose =require("mongoose")




const bucketSchema=new mongoose.Schema({
    
})






const BucketReviewSchema=new mongoose.Schema({

    auditId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Audit"
    },

    buckets:[bucketSchema]





},{timestamps:true})
