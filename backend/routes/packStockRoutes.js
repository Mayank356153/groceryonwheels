const router = require("express").Router();
const ctrl   = require("../controllers/rawLotController");

//  /api/pack-stocks
router.get   ("/",            ctrl.getPackStocks);      // list packs left
router.patch ("/:id/deduct",  ctrl.deductPackStock);    // decrease after sale

module.exports = router;
