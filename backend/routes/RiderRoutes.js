 const express=require("express")

 const router=express.Router()
const {fieldsUpload } = require("../middleware/upload.js");
const{createRider,getAllRider,deleteById,giveRating,updateRider,getAvailableRider,riderLogin}=require("../controllers/riderController.js")
const uploadRiderImages = require("../middleware/uploadRiderImages.js");

const{authMiddleware,hasPermission}=require("../middleware/authMiddleware.js")

// For multiple specific fields (recommended)
router.post("/create",authMiddleware,hasPermission("rider","Add"),fieldsUpload([
      { name: 'addharCardImage'},
      { name: 'drivingLicenseImage' },
      { name: 'panCardImage'},
      { name: 'profileImage' }
    ]),
    createRider
  );
  
router.put(
  "/update/:id",
  authMiddleware,
  uploadRiderImages,
  updateRider
);

router.put("/login",riderLogin)

  router.get("/all",authMiddleware,hasPermission("rider","View"),getAllRider)
  router.get("/available",authMiddleware,hasPermission("rider","View"),getAvailableRider)
  
  router.delete("/:id",authMiddleware,hasPermission("rider","Delete"),deleteById)

router.put("/rating/:riderid",giveRating)

module.exports=router
