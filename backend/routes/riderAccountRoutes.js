const express=require("express")

const router=express.Router()

const{authMiddleWare,hasPermission}=require("../middleware/authMiddleware")


const{riderAccountDelete,riderAccountUpdate,addmoney,gi}=require("../controllers/riderAccountController")

router.delete("/:id",riderAccountDelete)

router.put("/:id",riderAccountUpdate)

router.post("/money",addmoney)

router.get("/mayank",gi)



module.exports=router