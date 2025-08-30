const express = require('express');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');
const { createMarketingItem, getAllMarketingItems,  updateMarketingItem, deleteMarketingItem, getMarketingItemByType, getMarketingItemById } = require('../controllers/MarketingItemController');
const router = express.Router();


router.post("/add",authMiddleware,hasPermission("Marketing_Items","Add"),createMarketingItem);

router.get("/all", authMiddleware,hasPermission("marketing_items","View"),getAllMarketingItems);

router.get("/:type",authMiddleware,hasPermission("marketing_items","View"),getMarketingItemByType)

// router.get("/:id",authMiddleware,hasPermission("MarketingItems","View"),getMarketingItemById)
router.get("/:id",authMiddleware,hasPermission("marketing_items","View"),getMarketingItemById)

router.delete("/:id", authMiddleware,hasPermission("marketing_items","Delete"),deleteMarketingItem);

router.put("/:id", authMiddleware,hasPermission("marketing_items","Edit"),updateMarketingItem);




module.exports = router;