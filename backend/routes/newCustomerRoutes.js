const express=require("express")

const router=express.Router();
 
const upload=require("../middleware/upload")

const{createCustomer,getcustomer, updateCustomer, deleteCustomer, getCustomerById}=require("../controllers/newCustomerController")


router.post("/add",createCustomer)

router.get("/all",getcustomer)

router.put("/:id",updateCustomer)

router.delete("/:id",deleteCustomer)

router.get("/:id",getCustomerById)

module.exports=router