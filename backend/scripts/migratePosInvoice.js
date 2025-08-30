// scripts/migratePosInvoice.js   (run once)
import PosOrder from "../models/PosOrder.js";
(async () => {
  const cursor = PosOrder.find({ saleCode: { $exists: false } }).cursor();
  for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
    doc.saleCode = doc.invoiceCode;   // copy old value
    await doc.save({ validateBeforeSave: false });
  }
  console.log("Migration complete");
  process.exit(0);
})();
