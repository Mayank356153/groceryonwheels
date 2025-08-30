const express = require("express");
const {
  getAllItems,
  getItemById,
  getItemSummaries,
  getRelatedItems
} = require("../controllers/itemController");
const { protect } = require("../middleware/customerauthMiddleware");
const router = express.Router();

// these four all reuse your existing controller functions
router.get("/items",           /*public*/      getAllItems);
router.get("/items/summary",   /*public*/      getItemSummaries);
router.get("/items/:id",       /*public*/      getItemById);
router.get("/items/:id/related", protect,      getRelatedItems);

module.exports = router;