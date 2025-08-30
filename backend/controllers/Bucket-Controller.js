const Bucket=require("../models/AuditBucket")
const Item=require("../models/itemModel")


exports.createBucket=async(req,res)=>{
    try {
        const {auditorId,items}=req.body
       
         if(!auditorId){
            return res.status(400).json({
                message:"Auditor not found"
            })
         }

         if(items.length <= 0){
             return res.status(400).json({
                message:"items not found"
            })
         }

          console.log(items)
          const itemsFormat=items.map(item=>({
            item_id:item.item_id,
            quantity:item.quantity
          }))
          console.log(itemsFormat)
         const BucketSaved=await new Bucket({
            auditorId:auditorId,
            items:itemsFormat
         }).save();

         if(!BucketSaved){
            return res.status(400).json({
                message:"Error in creating bucket"
            })
         }
         return res.status(200).json({
            message:"Bucket created",
            data:BucketSaved
         })



    } catch (error) {
        console.log("Erro in bucket",error)
        return res.status(500).json({
            message:"Internal server error",
            error:error.message
        })
    }
}


exports.getBucketbyAuditorId=async(req,res)=>{
    try {
        const id=req.params.auditor_id
        console.log(id)
        const auditbucket=await Bucket.find({auditorId:id}).populate("items.item_id")
        console.log(auditbucket)
        if(!auditbucket){
            return res.status(400).json({
                message:"Error in getting bucket "
            })
        }
        return res.status(200).json({
            success:true,
            data:auditbucket
        })
    } catch (error) {
         console.log("Error in getting bucket",error)
        return res.status(500).json({
            message:"Internal server error",
            error:error.message
        })
    }
}



exports.deleteBucket = async (req, res) => {
    try {
        // 1. Validate the bucket ID
        const { bucketId } = req.params;
        
        if (!bucketId) {
            return res.status(400).json({
                success: false,
                message: 'Bucket ID is required'
            });
        }

        // 2. Check if bucket exists
        const bucket = await Bucket.findById(bucketId);
        
        if (!bucket) {
            return res.status(404).json({
                success: false,
                message: 'Bucket not found'
            });
        }

        // 3. Delete the bucket
        await Bucket.findByIdAndDelete(bucketId);

        // 4. Respond with success
        res.status(200).json({
            success: true,
            message: 'Bucket deleted successfully',
            deletedBucketId: bucketId
        });

    } catch (error) {
        console.error('Error deleting bucket:', error);
        
        // Handle specific errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid Bucket ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateBucket = async (req, res) => {
    try {
        const { bucketId } = req.params;
        const { items } = req.body;

        // 1. Validate inputs
        if (!bucketId) {
            return res.status(400).json({
                success: false,
                message: "Bucket ID is required"
            });
        }

        if (!items || items.length <= 0) {
            return res.status(400).json({
                success: false,
                message: "Items array cannot be empty"
            });
        }

        // 2. Check if bucket exists
        const existingBucket = await Bucket.findById(bucketId);
        if (!existingBucket) {
            return res.status(404).json({
                success: false,
                message: "Bucket not found"
            });
        }

        // 3. Update the bucket
        const updatedBucket = await Bucket.findByIdAndUpdate(
            bucketId,
            { 
                items: items,
                updatedAt: Date.now() // Track update time
            },
            { new: true, runValidators: true } // Return updated document and validate
        );

        // 4. Return response
        return res.status(200).json({
            success: true,
            message: "Bucket updated successfully",
            data: updatedBucket
        });

    } catch (error) {
        console.error("Error updating bucket:", error);
        
        // Handle specific errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid Bucket ID format"
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};