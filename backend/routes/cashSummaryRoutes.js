// routes/cashSummaryRoutes.js
const express            = require("express");
const { getCashSummary } = require("../controllers/cashSummaryController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/cash-summary",
  authMiddleware,
  hasPermission("CashSummary", "View"),
  getCashSummary
);

module.exports = router;
