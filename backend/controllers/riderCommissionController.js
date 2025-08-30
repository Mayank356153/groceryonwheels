const RiderCommission=require("../models/riderCommissionModel")
const Store=require("../models/storeModel")

//create
exports.createRiderCommission = async (req, res) => {
    try {
        const { storeId, totalAmount, moneyBreakdown } = req.body;

        // Validate required fields
        if (!storeId || !totalAmount || !moneyBreakdown?.length) {
            return res.status(400).json({
                success: false,
                message: "Store ID, total amount, and money breakdown are required"
            });
        }

        // Check if store exists
        const storeExists = await Store.findById(storeId);
        if (!storeExists) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Validate money breakdown
        let calculatedTotal = 0;
        for (const item of moneyBreakdown) {
            if (!item.reason?.trim() || isNaN(item.amount) || item.amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Each breakdown item must have a valid reason and positive amount"
                });
            }
            calculatedTotal += Number(item.amount);
        }

        // Validate total amount matches breakdown sum
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) { // Allowing for floating point precision
            return res.status(400).json({
                success: false,
                message: `Total amount (${totalAmount}) doesn't match breakdown sum (${calculatedTotal})`
            });
        }

        // Create new commission
        const newCommission = new RiderCommission({
            storeId,
            totalAmount,
            moneyBreakdown: moneyBreakdown.map(item => ({
                reason: item.reason.trim(),
                amount: Number(item.amount)
            }))
        });

        // Save to database
        const savedCommission = await newCommission.save();

        return res.status(201).json({
            success: true,
            message: "Rider commission created successfully",
            data: savedCommission
        });

    } catch (error) {
        console.error("Error creating rider commission:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

//get all 
exports.getAll=async(req,res)=>{
    try {
        const data=await RiderCommission.find().populate("storeId")
        if(!data){
            res.status(400).json({
                message:"Unable to search for rider commission info"
            })
        }
        return res.status(200).json({
            message:"Fetched successfully",
            data:data
        })
    } catch (error) {
        return res.status(500).json({
            message:"Internal server error",
            message:error.message
        })
    }
}

// //get by id
exports.getById=async(req,res)=>{
   try {
     const{id}=req.params
     if(!id){
         return res.status(500).json({
             message:"id is required",
         })
     }
     const data=await RiderCommission.findById(id).populate("storeId")
     return res.status(200).json({
         message:"Find successfully",
         data:data
     })
   } catch (error) {
     return res.status(500).json({
            message:"Internal server error",
            message:error.message
        })
   }

}


exports.deletebyid=async(req,res)=>{
   try {
     const id=req.params.id
     if(!id){
  return res.status(500).json({
             message:"id is required",
         })
     }
     const data =await RiderCommission.findByIdAndDelete(id)
     if(!data){
        return res.status(400).json({
            message:"NNo such commission model exist"
        })
     }
     return res.status(200).json({
        message:"Deleted successfully"
     })
   } catch (error) {
    return res.status(500).json({
            message:"Internal server error",
            message:error.message
        })
   }
}
// Update rider commission by ID
exports.updateRiderCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId, totalAmount, moneyBreakdown } = req.body;

        // Validate required fields
        if (!storeId || !totalAmount || !moneyBreakdown?.length) {
            return res.status(400).json({
                success: false,
                message: "Store ID, total amount, and money breakdown are required"
            });
        }

        // Check if commission exists
        const existingCommission = await RiderCommission.findById(id);
        if (!existingCommission) {
            return res.status(404).json({
                success: false,
                message: "Rider commission not found"
            });
        }

        // Check if store exists
        const storeExists = await Store.findById(storeId);
        if (!storeExists) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Validate money breakdown
        let calculatedTotal = 0;
        for (const item of moneyBreakdown) {
            if (!item.reason?.trim() || isNaN(item.amount) || item.amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Each breakdown item must have a valid reason and positive amount"
                });
            }
            calculatedTotal += Number(item.amount);
        }

        // Validate total amount matches breakdown sum
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Total amount (${totalAmount}) doesn't match breakdown sum (${calculatedTotal})`
            });
        }

        // Prepare update data
        const updateData = {
            storeId,
            totalAmount,
            moneyBreakdown: moneyBreakdown.map(item => ({
                reason: item.reason.trim(),
                amount: Number(item.amount)
            })),
            updatedAt: new Date()
        };

        // Update commission
        const updatedCommission = await RiderCommission.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Rider commission updated successfully",
            data: updatedCommission
        });

    } catch (error) {
        console.error("Error updating rider commission:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};