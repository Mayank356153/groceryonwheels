const express=require("express")
const {createBanner, getBannerById, updateBannerById, deleteBannerById, getAllBanner,singleItemBanner} =require("../controllers/bannerController.js")
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload")
const router =express.Router();


router.post("/create", authMiddleware, hasPermission("Banner", "Add"), createBanner);

router.get("/all",authMiddleware,hasPermission("Banner","View"),getAllBanner)


router.get("/:id",authMiddleware,hasPermission("Banner","View"),getBannerById)

router.put("/:id",authMiddleware,hasPermission("Banner","Edit"),updateBannerById)

router.delete("/:id",authMiddleware,hasPermission("Banner","Delete"),deleteBannerById)



module.exports=router