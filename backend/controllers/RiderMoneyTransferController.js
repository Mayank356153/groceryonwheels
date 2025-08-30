const Accounts=require("../models/accountModel")
const Rider=require("../models/RiderModel")
const RiderAccount=require("../models/RiderAccount")
const mongoose=require("mongoose")
const crypto = require("crypto");

function generateTransactionId() {
  const timestamp = Date.now(); // current time in ms
  const randomStr = crypto.randomBytes(4).toString("hex"); // 8-char random string
  return `TXN-${timestamp}-${randomStr}`;
}
// exports.createTransfer=async(req,res)=>{
//    try {
//      const{
//           transferAccountId,
//         amount,
//         riderID,
//         riderAccountId
//      }=req.body
//     console.log(req.body)  //1
 
//      if(!transferAccountId || !amount || !riderID || !riderAccountId ){
//          return res.status(400).json({
//              message:"All Fields are required"
//          })
//      }
//      if(amount < 0){
//           return res.status(400).json({
//              message:"Amount can't be negative"
//          })
//      }
 
//      const riderExist=await Rider.findById(riderID)  
//      if(!riderExist){
//             return res.status(400).json({
//              message:"No such rider exist"
//          })
//      }
 
//      console.log(riderExist)//3
 
//      const rideraccountExist=await RiderAccount.findById(riderAccountId) 
//      if(!rideraccountExist){
//           return res.status(400).json({
//              message:"No such rider account exist"
//          })
//      }
 
//      console.log(rideraccountExist)//4
//      const transferaccountExist=await Accounts.findById(transferAccountId)
//      if(!transferaccountExist){
//           return res.status(400).json({
//              message:"No such transfer account exist"
//          })
//      }
 
//      console.log(transferaccountExist)//5
//     //  if(rideraccountExist.deposit<amount){
//     //       return res.status(400).json({
//     //          message:"Can't deposit amount more than presence"
//     //      })
//     //  }
//      const moneyChange=rideraccountExist.openingBalance-amount
//      console.log(moneyChange)
//       const riderAccountChange=await RiderAccount.findByIdAndUpdate(riderAccountId,{deposit:moneyChange})
//       console.log("aaa")  
//       console.log(riderAccountChange)//6
//         if(!riderAccountChange){
//           return res.status(400).json({
//              message:"can't make changes in rider account"
//          })
//      }
 
//       const moneyAdded=transferaccountExist.currentBalance+amount;
 
//       const TransferAccountChange=await Accounts.findByIdAndUpdate(transferAccountId,{currentBalance:moneyAdded})
 
//        if(!TransferAccountChange){
//           return res.status(400).json({
//              message:"can't make changes in store account"
//          })
//      }
       
//      return res.status(200).json({
//          message:"Money transfer successfully",
//          rider:riderAccountChange,
//          transfer:TransferAccountChange
//      })
      
//    } catch (error) {
//     return res.status(500).json({
//         message:"Internal serval error",
//         error:error.message
//     })
//    }

   


// }

function generateNextId(currentId) {
  // Example: TR-2025-001
  const parts = currentId.split("-");

  if (parts.length !== 3) {
    throw new Error("Invalid ID format. Expected format: TR-YYYY-NNN");
  }

  const prefix = parts[0];           // TR
  const year = parts[1];             // 2025
  const number = parseInt(parts[2]); // 001 → 1

  const nextNumber = number + 1;
  const nextNumberStr = String(nextNumber).padStart(3, "0"); // → "002"

  return `${prefix}-${year}-${nextNumberStr}`; // → TR-2025-002
}
exports.createTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { transferAccountId, amount, riderID, riderAccountId } = req.body;

        // Validate input
        if (!transferAccountId || !amount || !riderID || !riderAccountId) {
            await session.abortTransaction();
            return res.status(400).json({ message: "All fields are required" });
        }

        if (amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Amount must be positive" });
        }

        // Check if entities exist
        const [riderExist, rideraccountExist, transferaccountExist] = await Promise.all([
            Rider.findById(riderID).session(session),
            RiderAccount.findById(riderAccountId).session(session),
            Accounts.findById(transferAccountId).session(session)
        ]);

        if (!riderExist || !rideraccountExist || !transferaccountExist) {
            await session.abortTransaction();
            return res.status(404).json({ 
                message: "One or more entities not found",
                details: {
                    rider: !!riderExist,
                    riderAccount: !!rideraccountExist,
                    transferAccount: !!transferaccountExist
                }
            });
        }

        // Check sufficient funds
        // const availableFunds = Math.max(
        //     rideraccountExist.deposit || 0, 
        //     rideraccountExist.openingBalance || 0
        // );
        
        // if (availableFunds < amount) {
        //     await session.abortTransaction();
        //     return res.status(400).json({ message: "Insufficient funds in rider account" });
        // }

        // // Determine which balance to deduct from
        // const useDeposit = rideraccountExist.deposit >= amount;
        // const balanceField = useDeposit ? 'deposit' : 'openingBalance';
        // const newRiderBalance = (rideraccountExist[balanceField] || 0) - amount;
        // const newTransferBalance = (transferaccountExist.currentBalance || 0) + amount;

        // // Create transaction record
        // const transferDetail = {
        //     transactionId: generateNextId("TR-2025-001"),
        //     amount: amount,
        //     type: "Money Transfer",
        //     format: "Debited",
        //     date: new Date()
        // };

        // // Update all accounts in a transaction
        // const [updatedRider, updatedRiderAccount, updatedTransferAccount] = await Promise.all([
        //     Rider.findByIdAndUpdate(
        //         riderID,
        //         { $push: { transactions: transferDetail } },
        //         { new: true, session }
        //     ),
        //     RiderAccount.findByIdAndUpdate(
        //         riderAccountId,
        //         { 
        //             [balanceField]: newRiderBalance,
        //             moneyTransfer: amount,
        //             currentBalance: -newRiderBalance 
        //         },
        //         { new: true, session }
        //     ),
        //     Accounts.findByIdAndUpdate(
        //         transferAccountId,
        //         { currentBalance: newTransferBalance },
        //         { new: true, session }
        //     )
        // ]);

        // await session.commitTransaction();

        // return res.status(200).json({
        //     message: "Money transferred successfully",
        //     rider: updatedRider,
        //     riderAccount: updatedRiderAccount,
        //     transferAccount: updatedTransferAccount
        // });

  const totalBalance = (rideraccountExist.currentBalance || 0)

        if (totalBalance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient funds" });
        }

    
         const remainingamount =totalBalance - amount
      
         // Create transaction record
       const transferDetail = {
  transcationId: generateTransactionId,
  amount: amount,
  type: "Money Transfer",
  format: "Debited",
  date: new Date()
};

        // Update all accounts
        const [updatedRider, updatedRiderAccount, updatedTransferAccount] = await Promise.all([
             Rider.findByIdAndUpdate(
    riderID,
    { 
      $push: { RiderTranscation: transferDetail } // Use $push to add to array
    },
    { new: true, session }
  ),
            RiderAccount.findByIdAndUpdate(
                riderAccountId,
                { 
                    
                    currentBalance: remainingamount,
                    moneyTransfer: rideraccountExist.moneyTransfer + amount
                },
                { new: true, session }
            ),
           
        ]);
        console.log(updatedRider)
        await session.commitTransaction();

        return res.status(200).json({
            message: "Transfer successful",
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Transfer failed:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        session.endSession();
    }
};