const express=require("express")

const router=express.Router()

const{authMiddleWare,hasPermission}=require("../middleware/authMiddleware")

const{createRiderCommission,getAll,deletebyid,updateRiderCommission}=require("../controllers/riderCommissionController")

router.post("/create",createRiderCommission)


router.get("/all",getAll)

router.delete("/:id",deletebyid)


router.put("/:id",updateRiderCommission)




module.exports=router