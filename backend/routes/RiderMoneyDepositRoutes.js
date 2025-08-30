const express=require("express")

const router=express.Router()
const {createTransfer}=require("../controllers/RiderMoneyTransferController")


router.post("/create",createTransfer)




module.exports=router