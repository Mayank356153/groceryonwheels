const RiderAccount=require("../models/RiderAccount")
const Rider=require("../models/RiderModel")
const crypto = require('crypto'); // Add this line at the top of your file
function generateTransactionId() {
  const timestamp = Date.now(); // current time in ms
  const randomStr = crypto.randomBytes(4).toString("hex"); // 8-char random string
  return `TXN-${timestamp}-${randomStr}`;
}

//delete account by id
exports.riderAccountDelete=async(req,res)=>{
   try {
     const{id}=req.params;
     if(!id){
         return res.status(400).json({
             message:"ID is required"
         })
     }
 
     const account =await RiderAccount.findByIdAndDelete(id)
     if(!account){
         return res.status(400).json({
             message:"Unable to delete rider account"
         })
     }
     return res.status(200).json({
         message:"Deleted successfully"
     })
   } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
   }
}



//account update by id
exports.riderAccountUpdate=async(req,res)=>{
   try {
     const id=req.params.id
     if(!id){
          return res.status(400).json({
             message:"ID is required"
         })
     }
     const response=RiderAccount.findByIdAndUpdate(id,req.body)
     if(!response){
          return res.status(400).json({
             message:"Unable to update rider account"
         })
     }
     return res.status(200).json({
         message:"Updated Successfully",
         data:response
     })
   } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
   }
}


exports.addmoney = async (req, res) => {
  try {
    const { riderId, amount,riderAccountId } = req.body;
   console.log(req.body)
    if (!riderId) {
      return res.status(400).json({ message: "Rider ID is required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount should be positive and can't be zero" });
    }

    const riderExist = await Rider.findById(riderId);
    if (!riderExist) {
      return res.status(400).json({ message: "No such rider exists" });
    }

    const riderAccountExist = await RiderAccount.findById(riderAccountId);
    if (!riderAccountExist) {
      return res.status(400).json({ message: "No account exists for rider" });
    }

    const transferDetail = {
      transcationId: generateTransactionId(),
      amount: amount,
      type: "Deposit",
      format: "Credited",
      date: new Date()
    };

    const rideraccountUpdate = await RiderAccount.findByIdAndUpdate(
      riderAccountId,
      { $inc: { currentBalance: +amount } },
      { new: true }
    );

    if (!rideraccountUpdate) {
      return res.status(400).json({ message: "Unable to update rider account" });
    }

    const updateRiderTransaction = await Rider.findByIdAndUpdate(
      riderId,
      { $push: { RiderTranscation: transferDetail } }
    );

    if (!updateRiderTransaction) {
      return res.status(400).json({
        message: "Money added, but unable to update rider transaction"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Money added successfully"
    });

  } catch (error) {
     console.error(error);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });
  }
};


// exports.addmoney = async (req, res) => {
//   console.log("asd");
  
//   try {
//     return res.status(200).json({ 
//       message: "ASAss"
//     });
//   } catch (error) {
//     console.error("Error in addmoney:", error);
//     return res.status(500).json({ 
//       success: false,
//       message: "Internal server error",
//       error: error.message // Send only the error message, not the whole error object
//     });
//   }
// }

exports.gi = async(req,res) =>{
  return res.status(200).json({
    message:"Asad"
  })
}