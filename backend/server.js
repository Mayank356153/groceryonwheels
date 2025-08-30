require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const UsersRoutes = require("./routes/UsersRoutes");
const roleRoutes = require("./routes/roleRoutes");
const storeRoutes = require("./routes/storeRoutes");
const messageRoutes = require("./routes/messageRoutes");
const customerRoutes = require("./routes/customerRoutes");
const deliveryAgentRoutes = require("./routes/deliveryAgentRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const brandRoutes = require("./routes/brandRoutes");
const variantRoutes = require("./routes/variantRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const stockAdjustmentRoutes = require("./routes/stockAdjustmentRoutes");
const stockTransferRoutes = require("./routes/stockTransferRoutes");
const taxRoutes = require("./routes/taxRoutes");
const unitRoutes = require("./routes/unitRoutes");
const paymentTypeRoutes = require("./routes/paymentTypeRoutes");
const customerDataRoutes = require("./routes/customerDataRoutes");
const advancePaymentRoutes = require("./routes/advancePaymentRoutes");
const accountRoutes = require("./routes/accountRoutes");
const moneyTransferRoutes = require("./routes/moneyTransferRoutes");
const depositRoutes = require("./routes/depositRoutes");
const cashTransactionRoutes = require("./routes/cashTransactionRoutes.js");
const posRoutes = require("./routes/posRoutes");
const salesRoutes = require("./routes/salesRoutes");
const salesReturnRoutes = require("./routes/salesReturnRoutes");
const discountCouponRoutes = require("./routes/discountCouponRoutes");
const customerCouponRoutes = require("./routes/customerCouponRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const expenseCategoryRoutes = require("./routes/expenseCategoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const posSettingsRoutes = require("./routes/posSettingsRoutes");
const countryStateRoutes = require("./routes/countryStateRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const Add_deliveryBoyRoutes = require('./routes/AddDeliveryBoyRoutes');
const mybookingRoutes = require('./routes/mybookingRoutes');
const vandeliveryBoyRoutes = require('./routes/VandeliveryBoyRoutes');
//const deliverySlotRoutes = require('./routes/deliverySlotRoutes');
const deliveryslotRoutes=require("./routes/deliveryslotRoutes.js")
const userslotpageRoutes = require("./routes/UserSlotPageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const subcategoryRoutes  = require("./routes/subcategoryRoutes");
const SubSubCategoryRoutes = require("./routes/SubSubCategoryRoutes");
const terminalRoutes = require("./routes/terminalRoutes");
const cashSummaryRoutes = require("./routes/cashSummaryRoutes");
const bannerRoutes=require("./routes/bannerRoutes.js")
const MarketingItemRoutes=require("./routes/marketingItemRoutes.js")
const ProductRoutes=require("./routes/ProductRoutes.js")
const path = require("path");
const ledgerRoutes = require('./routes/ledger');
const listEndpoints = require('./routes/listEndpoints');
const linkImages = require("./routes/items-link-images");
const location=require("./routes/location.js")

const app = express();


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Reflect the origin back in the response
    callback(null, origin);
  },
  credentials: true,
}));







app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("✅ MongoDB Connected");
    require('./helpers/imagePullQueue'); // model
    require('./workers/imagePullWorker'); // cron worker
    require('./helpers/deletionScheduler'); // existing
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));



console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);
require("./watchers/orderStatusWatcher")();


app.use("/api/way",location);
app.use("/auth", authRoutes);
app.use("/admin", userRoutes);
app.use("/admiaddinguser", UsersRoutes);
app.use("/admincreatingrole", roleRoutes);
app.use("/admin/store", storeRoutes);
app.use("/api/message", messageRoutes);
app.use("/customer", customerRoutes);
app.use("/delivery-agent", deliveryAgentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", itemRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api", warehouseRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
app.use("/api", taxRoutes);
app.use("/api", unitRoutes);
app.use("/api", paymentTypeRoutes);
app.use("/api/customer-data", customerDataRoutes);
app.use("/api/advance-payments", advancePaymentRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/money-transfers", moneyTransferRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/cash-transactions", cashTransactionRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sales-return", salesReturnRoutes);
app.use("/api/discount-coupons", discountCouponRoutes);
app.use("/api/customer-coupons", customerCouponRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/pos-settings", posSettingsRoutes);
app.use("/api", countryStateRoutes);
app.use("/api", subscriptionRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', Add_deliveryBoyRoutes);
app.use('/api', mybookingRoutes);
app.use('/api/van-delivery-boys',vandeliveryBoyRoutes);
//app.use('/api', deliverySlotRoutes);

app.use('/api/notification', notificationRoutes);
app.use("/api/userslot",userslotpageRoutes);
app.use("/api/subcategories",  subcategoryRoutes);
app.use("/api/sub-subcategories", SubSubCategoryRoutes);
app.use('/api', terminalRoutes);
app.use("/api", cashSummaryRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);
app.use("/api/payments", require("./routes/payments"));
app.use("/api/banner" ,bannerRoutes);
app.use("/api/marketing-item", MarketingItemRoutes);
app.use("/api/product", ProductRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use("/api", listEndpoints);
app.use("/api", require("./routes/cashSaleDetails"));
app.use("/api/deletion-requests", require("./routes/deletionRequests"));
app.use("/api/push", require("./routes/pushRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/customer",   require("./routes/publicItemRoutes"));
app.use('/customer/api', require('./routes/publicCategoryRoutes'));
app.use('/customer/api', require('./routes/publicSubcategoryRoutes'));
app.use('/customer/api', require('./routes/publicSubSubCategoryRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));


app.use("/api/audit",           require("./routes/AuditRoutes.js"));
app.use("/api/rider",           require("./routes/RiderRoutes.js"));
app.use("/api/money-transfer",  require("./routes/RiderMoneyDepositRoutes.js"));
app.use("/api/rider-commission",require("./routes/riderCommissionRoutes"));
app.use("/api/rider-account",   require("./routes/riderAccountRoutes.js"));
app.use("/print",               require("./routes/printRoutes.js"));
app.use("/api/order-payments",  require("./routes/orderPaymentRoutes"));
app.use("/api/customer",        require("./routes/newCustomerRoutes"));
app.use("/api/delivery/slot",deliveryslotRoutes)

//search new items
app.use("/api/new-items/search", require("./routes/NewItemsSearch"));

app.use(
  "/api/warehouse-location",
  require("./routes/warehouseLocationRoutes")
);
app.use("/api/raw-lots", require("./routes/rawLotRoutes"));
app.use("/api/catalog", require("./routes/catalogRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/pack-stocks", require("./routes/packStockRoutes"));
app.use("/api", require("./routes/bookingRoutes.js"))
app.use('/api', linkImages);




app.use((err, req, res, next) => {
  console.error(err);  // so you can see the stack in your logs
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
