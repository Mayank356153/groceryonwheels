const express = require("express");
const router = express.Router();
const cashSaleDetailsController = require("../controllers/cashSaleDetailsController");

router.get("/cash-sale-details", cashSaleDetailsController.getCashSaleDetails);

module.exports = router;