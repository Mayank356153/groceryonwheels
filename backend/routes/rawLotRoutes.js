const router = require("express").Router();
const ctrl = require("../controllers/rawLotController");

router
  .route("/")
  .post(ctrl.createRawLot)  // create from Purchase
  .get(ctrl.getRawLots);    // list / filter

router.patch("/:id/pack", ctrl.packLot);  // decide pack 
router.patch("/:id/edit", ctrl.editPackLot);  // edit pack details
router.get("/pack-stocks", ctrl.getPackStocks); // list sellable packs
router.get("/pack-stocks/:lotId", ctrl.getPackStock); // single lot details
router.patch("/pack-stocks/:id/deduct", ctrl.deductPackStock);

module.exports = router;