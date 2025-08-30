// App.js  – route‑level code‑splitting version
import axios from "axios";
import "leaflet/dist/leaflet.css";
import RequireAuth from "./auth/RequireAuth";

// 4) React‑Router & React‑lazy
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// 1) Axios defaults
axios.defaults.baseURL        = "/vps";
axios.defaults.withCredentials = true;

// 2) Monkey‑patch window.fetch → /vps/…
const _fetch = window.fetch;
window.fetch = (resource, init) => {
  let url = resource;
  if (typeof resource === "string" && resource.startsWith("/") && !resource.startsWith("/vps/")) {
    url = "/vps" + resource;
  }
  return _fetch(url, init);
};

// 3) Global CSS


/* ─────────────── ROUTE COMPONENTS ─────────────── */

const AdminRegister             = lazy(() => import("./pages/AdminRegister"));
const AdminLogin                = lazy(() => import("./pages/AdminLogin"));
const AuditorLogin              = lazy(() => import("./pages/AuditorLogin"));
const AdminDashboard            = lazy(() => import("./components/Dashboard/AdminDashboard"));
const UserLogin                 = lazy(() => import("./pages/UserLogin"));
const AddUser                   = lazy(() => import("./components/AddUser"));
const UserList                  = lazy(() => import("./components/User/UserList"));
const RoleList                  = lazy(() => import("./components/User/RoleList"));
const CreateRolelist            = lazy(() => import("./components/User/CreateRolist"));
const CreateUres                = lazy(() => import("./components/User/CreateUser"));
const RiderList                 = lazy(() => import("./components/User/RiderList"));
const CreateRider               = lazy(() => import("./components/User/CreateRider"));
const CreateRiderCommission     = lazy(() => import("./components/User/CreateRiderCommission"));
const RiderCommissionList       = lazy(() => import("./components/User/RiderCommissionList"));
const AddStore                  = lazy(() => import("./components/store/AddStore"));
const StoreView                 = lazy(() => import("./components/store/StoreView"));
const AddSubscription           = lazy(() => import("./components/store/AddSubscription"));
const SubscriptionList          = lazy(() => import("./components/store/SubscriptionList"));
const SystemTab                 = lazy(() => import("./components/store/SystemTab"));
const Reports                   = lazy(() => import("./pages/Reports"));
const ProfitLossReport          = lazy(() => import("./components/Reports/ProfitLossReport"));
const SalesPaymentReport        = lazy(() => import("./components/Reports/SalesPaymentReport"));
const ItemTransfer              = lazy(() => import("./components/Reports/ItemTransfer"));
const StockTransferReport       = lazy(() => import("./components/Reports/StockTransfer"));
const SaleItemsReport           = lazy(() => import("./components/Reports/SaleItems"));
const StockReport               = lazy(() => import("./components/Reports/StockReport"));
const ItemCompare               = lazy(() => import("./components/Reports/ItemCompare"));
const CustomerOrders            = lazy(() => import("./pages/CustomerOrders"));
const Supplierlist              = lazy(() => import("./components/contact/Supplierlist"));
const Customerlist              = lazy(() => import("./components/contact/Customerlist"));
const AddSupplier               = lazy(() => import("./components/contact/AddSupplier"));
const Addcustomer               = lazy(() => import("./components/contact/AddCustomer/Addcustomer"));
const NewCustomer               = lazy(() => import("./components/contact/NewCustomer"));
const NewCustomerlist           = lazy(() => import("./components/contact/NewCustomerList"));
const ImportCustomer            = lazy(() => import("./components/contact/import/ImportCustomer"));
const ImportSupplier            = lazy(() => import("./components/contact/import/ImportSupplier"));
const AddItem                   = lazy(() => import("./components/Items/AddItems"));
const NewItem                   = lazy(() => import("./components/Items/NewItem"));
const AddService                = lazy(() => import("./components/Items/AddServices"));
const AddUpdateServices         = lazy(() => import("./components/Items/AddUpdateServices"));
const ItemList                  = lazy(() => import("./components/Items/Itemlist"));
const CategoriesList            = lazy(() => import("./components/Items/CategoriesList"));
const CategoriesListform        = lazy(() => import("./components/Items/CategoriesListform"));
const SubCategoryList           = lazy(() => import("./components/Items/SubCategoryList"));
const SubCategoryForm           = lazy(() => import("./components/Items/SubCategoryForm"));
const SubSubCategoryList        = lazy(() => import("./components/Items/SubSubCategoryList"));
const BrandsList                = lazy(() => import("./components/Items/BrandsList"));
const BrandForm                 = lazy(() => import("./components/Items/BrandForm"));
const VariantAdd                = lazy(() => import("./components/Items/VariantAdd"));
const VariantsList              = lazy(() => import("./components/Items/VariantsList"));
const PrintLabels               = lazy(() => import("./components/Items/PrintLabels"));
const ImportItems               = lazy(() => import("./components/Items/ImportItems"));
const ImportServices            = lazy(() => import("./components/Items/ImportServices"));
const ImportEntity              = lazy(() => import("./components/Items/ImportEntity"));
const AddAdvance                = lazy(() => import("./components/advance/addadvance"));
const AdvanceList               = lazy(() => import("./components/advance/advancelist"));
const CustomerCoupenList        = lazy(() => import("./components/coupens/CustomerCouponsList"));
const CreateCustomerCoupons     = lazy(() => import("./components/coupens/CreateCustomerCoupon"));
const CreateCoupon              = lazy(() => import("./components/coupens/CreateCoupon"));
const CouponsMaster             = lazy(() => import("./components/coupens/CouponsMaster"));
const CreateMasterCoupon        = lazy(() => import("./components/coupens/CreateMasterCoupon"));
const CouponForm                = lazy(() => import("./components/coupens/CreateCustomerCoupon"));
const DiscountCouponForm        = lazy(() => import("./components/coupens/CreateCoupon"));
const DiscountCouponList        = lazy(() => import("./components/coupens/CouponsMaster"));
const NewQuotation              = lazy(() => import("./components/Quotation/NewQuotation"));
const QuotationList             = lazy(() => import("./components/Quotation/QuotationList"));
const QuotationForm             = lazy(() => import("./components/Quotation/NewQuotation"));
const NewPurchase               = lazy(() => import("./components/purchase/newpurcheas"));
const PurchaseList              = lazy(() => import("./components/purchase/purchaselist"));
const PurchaseReturnsList       = lazy(() => import("./components/purchase/PurchaseReturnsList"));
const PurchaseReturn            = lazy(() => import("./components/purchase/purchasereturn"));
const POS                       = lazy(() => import("./components/Sales/POS"));
const AddSale                   = lazy(() => import("./components/Sales/AddSale"));
const AddSalesRetutrn           = lazy(() => import("./components/Sales/AddSalesReturn"));
const AddSalesReturn            = lazy(() => import("./components/Sales/AddSalesReturn"));
const SaleList                  = lazy(() => import("./components/Sales/SalesList"));
const SalesPayment              = lazy(() => import("./components/Sales/SalesPayment"));
const SalesPaymentList          = lazy(() => import("./components/Sales/SalesReturnsList"));
const ViewSale                  = lazy(() => import("./components/Sales/ViewSale"));
const ReceivePayment            = lazy(() => import("./components/Sales/ReceivePayment"));
const POSInvoice                = lazy(() => import("./components/Sales/POSInvoice"));
const SalesReturn               = lazy(() => import("./components/Sales/SalesReturn"));
const ViewPayment               = lazy(() => import("./components/Sales/ViewPayment"));
const AddAccount                = lazy(() => import("./components/Accounts/AddAccounts"));
const AccountList               = lazy(() => import("./components/Accounts/AccountList"));
const MoneyTransferList         = lazy(() => import("./components/Accounts/MoneyTransferList"));
const AddMoneyTransfer          = lazy(() => import("./components/Accounts/AddMoneyTransfer"));
const AddDeposit                = lazy(() => import("./components/Accounts/AddDeposit"));
const DepositList               = lazy(() => import("./components/Accounts/DepositList"));
const CashTransactions          = lazy(() => import("./components/Accounts/CashTransactions"));
const AddVanCash                = lazy(() => import("./components/Accounts/AddVanCash"));
const RiderAccountList          = lazy(() => import("./components/Accounts/RiderAccountList"));
const AccountLedger             = lazy(() => import("./components/Accounts/AccountLedger"));
const AddStockAdjustment        = lazy(() => import("./components/Stock/AddStockAdjustment"));
const AdjustmentList            = lazy(() => import("./components/Stock/AdjustmentList"));
const AddStockTransfer          = lazy(() => import("./components/Stock/AddStockTransfer"));
const TransferList              = lazy(() => import("./components/Stock/TransferList"));
const ExpenseList               = lazy(() => import("./components/Expenses/ExpensesList"));
const AddExpense                = lazy(() => import("./components/Expenses/AddExpense"));
const AddExpenseCategory        = lazy(() => import("./components/Expenses/AddExpenseCategory"));
const ExpenseCategoryList       = lazy(() => import("./components/Expenses/ExpenseCategoryList"));
const SendMessage               = lazy(() => import("./components/Message/SendMessage"));
const MessageTemplatesList      = lazy(() => import("./components/Message/MessageTemplatesList"));
const UnitsList                 = lazy(() => import("./components/Settings/UnitsList"));
const PaymentTypesList          = lazy(() => import("./components/Settings/PaymentTypes"));
const ChangePassword            = lazy(() => import("./components/Settings/ChangePassword"));
const Store                     = lazy(() => import("./components/Settings/Store"));
const TaxList                   = lazy(() => import("./components/Settings/TaxList"));
const SmsApi                    = lazy(() => import("./components/Settings/SmsApi"));
const PosSettingsForm           = lazy(() => import("./components/Settings/Sale"));
const AddTax                    = lazy(() => import("./components/Settings/AddTax"));
const AddTaxGroup               = lazy(() => import("./components/Settings/AddTaxGroup"));
const AddUnit                   = lazy(() => import("./components/Settings/AddUnit"));
const AddPaymentType            = lazy(() => import("./components/Settings/AddPaymentType"));
const AddCountry                = lazy(() => import("./components/Places/AddCountry"));
const AddState                  = lazy(() => import("./components/Places/AddState"));
const CountryList               = lazy(() => import("./components/Places/CountryList"));
const StateList                 = lazy(() => import("./components/Places/StateList"));
const WarehouseForm             = lazy(() => import("./components/Warehpuse/WarehouseForm"));
const WarehouseList             = lazy(() => import("./components/Warehpuse/WarehouseList"));
const WarehouseTracker          = lazy(() => import("./components/Warehpuse/WarehouseTracker"));
const TerminalList              = lazy(() => import("./components/Terminal/TerminalList"));
const CreateTerminal            = lazy(() => import("./components/Terminal/CreateTerminal"));
const AddBanner                 = lazy(() => import("./components/Banners/AddBanner"));
const BannersList               = lazy(() => import("./components/Banners/BannersList"));
const AddMarketingItems         = lazy(() => import("./components/Banners/AddMarketingItems"));
const MarketingItemsList        = lazy(() => import("./components/Banners/MarketingItemView"));
const AddProduct                = lazy(() => import("./components/Banners/AddProduct"));
const ProductListView           = lazy(() => import("./components/Banners/ProductListView"));
const DeletionRequests          = lazy(() => import("./components/admin/deletion-requests"));
const ProfileEdit               = lazy(() => import("./pages/ProfileEdit"));
const OrderList                 = lazy(() => import("./components/Order/OrderList/OrderList"));
const DeliverySlotCreate        = lazy(() => import("./components/DeliverySlot/DeliverySlotCreate"));
const DeliverySlotList          = lazy(() => import("./components/DeliverySlot/DeliverySlotList"));
const Audit                     = lazy(() => import("./components/Auditor/Audit"));
const AuditDashboard            = lazy(() => import("./components/Auditor/AuditDashboard"));
const OpenAuditList             = lazy(() => import("./components/Auditor/OpenAuditList"));
const AllAudits                 = lazy(() => import("./components/Auditor/AllAudits"));
const BucketCreate              = lazy(() => import("./components/Auditor/BucketCreate"));
const UserBucketList            = lazy(() => import("./components/Auditor/UserBucketList"));
const ImageMerger               = lazy(() => import("./pages/ImageMerger"));
const ItemImageManagement       = lazy(() => import("./components/ImageManagement/ItemImageManagement"));
const CategoryImageManagement   = lazy(() => import("./components/ImageManagement/CategoryImageManagement"));
const SubCategoryImageManagement= lazy(() => import("./components/ImageManagement/subcategory/SubCategoryImageManagement"));
const SubSubCategoryImageManagement = lazy(() => import("./components/ImageManagement/subsubcategory/SubSubCategoryImageManagement"));
const AddressManager            = lazy(() => import("./components/contact/AddressManager"));
const AddressList               = lazy(() => import("./components/contact/AddressList"));
const ChatPanel                 = lazy(() => import("./components/Message/ChatPanel"));
const RawLotList                = lazy(() => import("./components/purchase/RawLotList"));
const BulkStockTransfer         = lazy(() => import("./components/Stock/BulkStockTransfer"));
const BulkPurchaseUpload        = lazy(() => import("./components/purchase/BulkPurchaseUpload"));
const TransferDetails           = lazy(() => import("./components/Stock/TransferDetails"));
const PurchaseDetail            = lazy(() => import("./components/purchase/PurchaseDetail"));
const AdminBookingPanel         = lazy(() => import("./components/Booking/VanBookingPanel"));
const RiderClaimPanel           = lazy(() => import("./components/Booking/RiderClaimPanel"));
const MyJobsPanel               = lazy(() => import("./components/Booking/MyJobsPanel"));
const BluetoothPrinterConnector = lazy(() => import("./components/Settings/BluetoothPrinterConnector"));
const SaleLocation =lazy(()=>import("./components/Sales/SaleLocation/SaleLocation"))

/* ─────────────── APP ─────────────── */
function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>

          <Route path="/sale-location"       element={<SaleLocation />} />
          <Route path="/admin-register"       element={<AdminRegister />} />
          <Route path="/"                     element={<AdminLogin />} />
          <Route path="/user-login"           element={<UserLogin />} />
          <Route path="/audit-login"          element={<AuditorLogin />} />
          <Route element={<RequireAuth />}>
          <Route path="/dashboard"            element={<AdminDashboard />} />
          <Route path="/auditor-dashboard"    element={<AuditDashboard />} />
          <Route path="/admin/add/user"       element={<AddUser />} />
          <Route path="/admin/user/list"      element={<UserList />} />
          <Route path="/create-user"          element={<CreateUres />} />
          <Route path="/admin/role/list"      element={<RoleList />} />
          <Route path="/admin/create/list"    element={<CreateRolelist />} />
          <Route path="/rider/list"           element={<RiderList />} />
          <Route path="/rider/add"            element={<CreateRider />} />
          <Route path="/rider-commission/create" element={<CreateRiderCommission />} />
          <Route path="/rider-commission/view"   element={<RiderCommissionList />} />
          <Route path="/account/rider/view"      element={<RiderAccountList />} />
          <Route path="/customer/add"            element={<Addcustomer />} />
          <Route path="/customer/view"           element={<Customerlist />} />
          <Route path="/customer/new"            element={<NewCustomer />} />
          <Route path="/customer/new/list"       element={<NewCustomerlist />} />
          <Route path="/supplier/add"            element={<AddSupplier />} />
          <Route path="/supplier/view"           element={<Supplierlist />} />
          <Route path="/customer/import"         element={<ImportCustomer />} />
          <Route path="/supplier/import"         element={<ImportSupplier />} />
          <Route path="/items/add"               element={<AddItem />} />
          <Route path="/items/new"               element={<NewItem />} />
          <Route path="/services/add"            element={<AddService />} />
          <Route path="/add-update-services"     element={<AddUpdateServices />} />
          <Route path="/item-list"               element={<ItemList />} />
          <Route path="/categories-list"         element={<CategoriesList />} />
          <Route path="/categories-list-form"    element={<ImportEntity entity="categories" />} />
          <Route path="/subcategories-list"      element={<SubCategoryList />} />
          <Route path="/subcategories-form"      element={<ImportEntity entity="subcategories" />} />
          <Route path="/sub-subcategories-form"  element={<ImportEntity entity="sub-subcategories" />} />
          <Route path="/sub-subcategory-list"    element={<SubSubCategoryList />} />
          <Route path="/brands-list"             element={<BrandsList />} />
          <Route path="/brand-form"              element={<BrandForm />} />
          <Route path="/variants-list"           element={<VariantsList />} />
          <Route path="/variant-add"             element={<VariantAdd />} />
          <Route path="/print-labels"            element={<PrintLabels />} />
          <Route path="/import-items"            element={<ImportItems />} />
          <Route path="/import-services"         element={<ImportServices />} />
          <Route path="/categories/import"       element={<ImportEntity entity="categories" />} />
          <Route path="/subcategories/import"    element={<ImportEntity entity="subcategories" />} />
          <Route path="/sub-subcategories/import" element={<ImportEntity entity="sub-subcategories" />} />
          <Route path="/store/add"               element={<AddStore />} />
          <Route path="/admin/store/edit"        element={<AddStore />} />
          <Route path="/store/view"              element={<StoreView />} />
          <Route path="/add-subscription"        element={<AddSubscription />} />
          <Route path="/subscription-list"       element={<SubscriptionList />} />
          <Route path="/subscription-list/:storeId" element={<SubscriptionList />} />
          <Route path="/edit-subscription/:id"   element={<AddSubscription />} />
          <Route path="/warehouse-form"          element={<WarehouseForm />} />
          <Route path="/warehouse-list"          element={<WarehouseList />} />
          <Route path="/warehouse-tracker"       element={<WarehouseTracker />} />
          <Route path="/terminal-list"           element={<TerminalList />} />
          <Route path="/create-terminal"         element={<CreateTerminal />} />
          <Route path="/reports"                 element={<Reports />} />
          <Route path="/reports/profit-loss"     element={<ProfitLossReport />} />
          <Route path="/reports/sales-payment"   element={<SalesPaymentReport />} />
          <Route path="/reports/customer-orders" element={<CustomerOrders />} />
          <Route path="/reports/stock-transfer"  element={<StockTransferReport />} />
          <Route path="/reports/sale-item"       element={<SaleItemsReport />} />
          <Route path="/reports/stock"           element={<StockReport />} />
          <Route path="/reports/item-compare"    element={<ItemCompare />} />
          <Route path="/reports/item-transfer"   element={<ItemTransfer />} />
          <Route path="/add-advance"             element={<AddAdvance />} />
          <Route path="/advance-list"            element={<AdvanceList />} />
          <Route path="/customer/coupon/view"    element={<CustomerCoupenList />} />
          <Route path="/customer/coupon/add"     element={<CreateCustomerCoupons />} />
          <Route path="/master/coupon/add"       element={<CreateMasterCoupon />} />
          <Route path="/master/coupon/view"      element={<CouponsMaster />} />
          <Route path="/create"                  element={<CouponForm />} />
          <Route path="/create-coupon"           element={<DiscountCouponForm />} />
          <Route path="/coupon-master"           element={<DiscountCouponList />} />
          <Route path="/newquotation"            element={<NewQuotation />} />
          <Route path="/quotation-list"          element={<QuotationList />} />
          <Route path="/quotation/edit/:id"      element={<QuotationForm />} />
          <Route path="/new-purchase"            element={<NewPurchase />} />
          <Route path="/purchase-list"           element={<PurchaseList />} />
          <Route path="/purchasereturn-list"     element={<PurchaseReturnsList />} />
          <Route path="/purchase-return"         element={<PurchaseReturn />} />
          <Route path="/pos"                     element={<POS />} />
          <Route path="/add-sale"                element={<AddSale />} />
          <Route path="/sales-return/add"        element={<AddSalesRetutrn />} />
          <Route path="/sales-return"            element={<SalesReturn />} />
          <Route path="/sales-return/edit/:id"   element={<AddSalesReturn />} />
          <Route path="/sale-list"               element={<SaleList />} />
          <Route path="/view-sale"               element={<ViewSale />} />
          <Route path="/sales-payment"           element={<SalesPayment />} />
          <Route path="/sales-payment-list"      element={<SalesPaymentList />} />
          <Route path="/receive-payment"         element={<ReceivePayment />} />
          <Route path="/pos-invoice/:id"         element={<POSInvoice />} />
          <Route path="/view-payment"            element={<ViewPayment />} />
          <Route path="/add-account"             element={<AddAccount />} />
          <Route path="/account-list"            element={<AccountList />} />
          <Route path="/accounts/:accountId/ledger" element={<AccountLedger />} />
          <Route path="/money-transfer-list"     element={<MoneyTransferList />} />
          <Route path="/add-money-transfer"      element={<AddMoneyTransfer />} />
          <Route path="/add-deposit"             element={<AddDeposit />} />
          <Route path="/deposit-list"            element={<DepositList />} />
          <Route path="/cash-transactions"       element={<CashTransactions />} />
          <Route path="/ledger/van-cash/new"     element={<AddVanCash />} />
          <Route path="/stock-adjustment"        element={<AddStockAdjustment />} />
          <Route path="/adjustment-list"         element={<AdjustmentList />} />
          <Route path="/stock-transfer"          element={<AddStockTransfer />} />
          <Route path="/transfer-list"           element={<TransferList />} />
          <Route path="/expense-list"            element={<ExpenseList />} />
          <Route path="/add-expense"             element={<AddExpense />} />
          <Route path="/add-expense-category"    element={<AddExpenseCategory />} />
          <Route path="/expense-category-list"   element={<ExpenseCategoryList />} />
          <Route path="/send-message"            element={<SendMessage />} />
          <Route path="/message-templates-list"  element={<MessageTemplatesList />} />
          <Route path="/units-list"              element={<UnitsList />} />
          <Route path="/add-unit"                element={<AddUnit />} />
          <Route path="/edit-unit/:unitId"       element={<AddUnit />} />
          <Route path="/payment-types-list"      element={<PaymentTypesList />} />
          <Route path="/add-payment-type"        element={<AddPaymentType />} />
          <Route path="/edit-payment-type/:paymentTypeId" element={<AddPaymentType />} />
          <Route path="/change-password"         element={<ChangePassword />} />
          <Route path="/store"                   element={<Store />} />
          <Route path="/tax-list"                element={<TaxList />} />
          <Route path="/add-tax"                 element={<AddTax />} />
          <Route path="/edit-tax/:taxId"         element={<AddTax />} />
          <Route path="/add-tax-group"           element={<AddTaxGroup />} />
          <Route path="/edit-tax-group/:taxGroupId" element={<AddTaxGroup />} />
          <Route path="/sms-api"                 element={<SmsApi />} />
          <Route path="/pos-settings"            element={<PosSettingsForm />} />
          <Route path="/system-tab"              element={<SystemTab />} />
          <Route path="/add-country"             element={<AddCountry />} />
          <Route path="/edit-country/:countryId" element={<AddCountry />} />
          <Route path="/country-list"            element={<CountryList />} />
          <Route path="/add-state"               element={<AddState />} />
          <Route path="/edit-state/:stateId"     element={<AddState />} />
          <Route path="/state-list"              element={<StateList />} />
          <Route path="/banners/add"             element={<AddBanner />} />
          <Route path="/banners/view"            element={<BannersList />} />
          <Route path="/marketingitem/add"       element={<AddMarketingItems />} />
          <Route path="/marketingitem/view"      element={<MarketingItemsList />} />
          <Route path="/product/add"             element={<AddProduct />} />
          <Route path="/product/view"            element={<ProductListView />} />
          <Route path="/admin/deletion-requests" element={<DeletionRequests />} />
          <Route path="/profile/edit"            element={<ProfileEdit />} />
          <Route path="/order/view"              element={<OrderList />} />
          <Route path="/delivery-slot/create"    element={<DeliverySlotCreate />} />
          <Route path="/delivery-slot/view"      element={<DeliverySlotList />} />
          <Route path="/audit"                   element={<Audit />} />
          <Route path="/audit/open"              element={<OpenAuditList />} />
          <Route path="/audit/all"               element={<AllAudits />} />
          <Route path="/bucket-create"           element={<BucketCreate />} />
          <Route path="/bucket-list"             element={<UserBucketList />} />
          <Route path="/image"                   element={<ImageMerger />} />
          <Route path="/item/image-management"   element={<ItemImageManagement />} />
          <Route path="/category/image-management" element={<CategoryImageManagement />} />
          <Route path="/subcategory/image-management" element={<SubCategoryImageManagement />} />
          <Route path="/subsubcategory/image-management" element={<SubSubCategoryImageManagement />} />
          <Route path="/address-manager"         element={<AddressManager />} />
          <Route path="/address-list"            element={<AddressList />} />
          <Route path="/chat-panel"              element={<ChatPanel />} />
          <Route path="/raw-lots"                element={<RawLotList />} />
          <Route path="/bulk-transfer"           element={<BulkStockTransfer />} />
          <Route path="/bulk-purchase-upload"    element={<BulkPurchaseUpload />} />
          <Route path="/transfer-details/:id"    element={<TransferDetails />} />
          <Route path="/purchase-detail/:id"     element={<PurchaseDetail />} />
          <Route path="/van/bookings"            element={<AdminBookingPanel />} />
          <Route path="/rider/claim"             element={<RiderClaimPanel />} />
          <Route path="/my-jobs"                 element={<MyJobsPanel />} />
          <Route path="/bluetooth-printer"       element={<BluetoothPrinterConnector />} />
        </Route>
</Routes>
      </Suspense>
    </Router>
  );
}

export default App;
