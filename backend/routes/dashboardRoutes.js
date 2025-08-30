const express = require("express");
const { getDashboardSummary, getChartData,getData } = require("../controllers/dashboardController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard-summary",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Dashboard", "View")(req, res, next);
  },
  getDashboardSummary
);


router.get(
  "/dashboard-chart-data",
    authMiddleware,
    (req, res, next) => {
      if (req.user.role.toLowerCase() === "admin") return next();
      return hasPermission("Dashboard", "View")(req, res, next);
    },
    getChartData
  );
  


  module.exports = router;