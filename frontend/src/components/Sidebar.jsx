import { useState, useEffect } from "react";
import { Transition } from '@headlessui/react';
import { MdAddAlarm } from 'react-icons/md';
import { MdViewList } from 'react-icons/md';
import {
  FaHome,
  FaAddressBook,
  FaUserPlus,
  FaUsers,
  FaStore,
  FaAngleDown,
  FaAngleUp,
  FaTags,
  FaDollarSign,
  FaCalendarPlus,
  FaClock,
  FaCube,
  FaCubes,
  FaHourglassEnd,
  FaThLarge,
  FaTachometerAlt,
  FaEnvelope,
  FaChartBar,
  FaCogs,
  FaList,
  FaUserShield,
  FaCartPlus, 
  FaCashRegister, 
  FaPlusCircle, 
  FaListAlt, 
  FaMoneyBillWave, 
  FaUndoAlt,
  FaShoppingBag,
  FaTicketAlt,
  FaTruck,
  FaClipboardList,
  FaTag,
  FaBoxes,
  FaFolderOpen, FaListUl, FaFileInvoice, FaUndo,
  FaPiggyBank, FaExchangeAlt, FaFileImport, FaPrint,
  FaShapes, FaLayerGroup, FaTools, FaPlusSquare,
  FaFileAlt, FaPaperPlane, FaWarehouse, FaKey, FaCreditCard,
  FaBalanceScale, FaPercentage, FaSms, FaQuestionCircle, FaBullhorn, FaCheck, FaBluetoothB
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const [dropdowns, setDropdowns] = useState({
    user: false,
    delivVanbooking: false,
    store: false,
    message: false,
    reports: false,
    advance: false,
    coupon:false,
    quotation:false,
    purchase:false,
    banners:false,
    sales: false,
    contact: false,
    account: false,
     terminal: false,
    places: false,
    item: false,
    stock: false,
    expense: false,
    warehouse: false,
    settings: false,
    help:false,
    helps:false,
    order:false,
    audit:false,
    imageManagement:false,
    deliverySlot:false
  });
  const [localPermissions, setLocalPermissions] = useState([]);

  const handleDropdownToggle = (section) => {
    setDropdowns((prev) => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = key === section ? !prev[key] : false;
      });
      return updated;
    });
  };
  
  const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
  const isAdmin = userRole === "admin";

  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        setLocalPermissions(JSON.parse(storedPermissions));
      } catch (error) {
        console.error("Error parsing permissions:", error);
        setLocalPermissions([]);
      }
    } else {
      setLocalPermissions([]);
    }
  }, []);

  // Helper function: checks if the user has a specific action for a module.
  const hasPermissionFor = (module, action) => {
    if (isAdmin) return true;
    return localPermissions.some(
      (perm) =>
        perm.module.toLowerCase() === module.toLowerCase() &&
        perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // Define sections visible to admin (as per the screenshot)
  const adminVisibleSections = [
    "dashboard",
    "user",
    "account",
    "audit",
    "imageManagement",
    "store",
    "places",
    "message",
    "reports",
    "settings",
    "help",
    "deliverySlot"
  ];

  const reportsList = [
    { name: "Profit & Loss Report", path: "/reports/profit-loss" },
    { name: "Sales & Payment Report", path: "/reports/sales-payment" },
    { name: "Customer Orders", path: "/reports/customer-orders" },
    { name: "GSTR-1 Report", path: "/reports/gstr-1" },
    {name:"Stock Transfer Report",path:"/reports/stock-transfer"},
    {name:"Sale Items Report",path:"/reports/sale-item"},
    {name:"Stock Report",path:"/reports/stock"},
    {name:"Item Compare",path:"/reports/item-compare"},
    {name:"Item Transfer",path:"/reports/item-transfer"},
  ];

  if (!isSidebarOpen) return null;

  return (
    <div className="absolute md:relative w-64 overflow-y-auto text-white bg-gray-900 z-[999] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-200 h-full">
      {/* Header */}
      <div
        className="flex items-center p-3 cursor-pointer hover:bg-gray-700"
        onClick={() => navigate("/dashboard")}
      >
        <FaHome />
        <span>Dashboard</span>
      </div>

      {/* Sidebar Menu Items */}
      <ul className="space-y-2">
         {(isAdmin || hasPermissionFor("users", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("user")}
            >
              <div className="flex items-center space-x-2">
                <FaUsers />
                <span>Users</span>
              </div>
              {dropdowns.user ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.user}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                <li
                  className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/admin/user/list")}
                >
                  <FaList />
                  <span>Users List</span>
                </li>
                <li
                  className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/admin/role/list")}
                >
                  <FaUserShield />
                  <span>Roles List</span>
                </li>

                <li
                  className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/rider/list")}
                >
                  <FaList />
                  <span>Rider List</span>
                </li>
              </ul>
            </Transition>
          </li>
        )}

        {/* Sales Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("sales") : hasPermissionFor("Sales", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("sales")}
            >
              <div className="flex items-center space-x-2">
                <FaCartPlus />
                <span>Sales</span>
              </div>
              {dropdowns.sales ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.sales}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("POSOrders", "Add") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/pos")}
                  >
                    <FaCashRegister />
                    <span>POS</span>
                  </li>
                )}
                {hasPermissionFor("Sales", "Add") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/add-sale")}
                  >
                    <FaPlusCircle />
                    <span>Add Sales</span>
                  </li>
                )}
                {hasPermissionFor("Sales", "View") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/sale-list")}
                  >
                    <FaListAlt />
                    <span>Sales List</span>
                  </li>
                )}
                {hasPermissionFor("Sales", "View") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/sales-payment")}
                  >
                    <FaMoneyBillWave />
                    <span>Sales Payment</span>
                  </li>
                )}
                {hasPermissionFor("SalesReturn", "View") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/sales-payment-list")}
                  >
                    <FaUndoAlt />
                    <span>Sales Returns List</span>
                  </li>
                )}
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/sale-location")}
                  >
                    <FaUndoAlt />
                    <span>BillByLocation</span>
                  </li>
              </ul>
            </Transition>
          </li>
        )}
       <li
  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
  onClick={() => handleDropdownToggle('delivVanbooking')}
>
  <div className="flex items-center space-x-2">
    <FaTruck />
    <span>Delivery Van Booking</span>
  </div>
  {dropdowns.delivVanbooking ? <FaAngleUp /> : <FaAngleDown />}
</li>
<Transition
  show={dropdowns.delivVanbooking}
  enter="transition-all duration-300 ease-out"
  enterFrom="transform opacity-0 -translate-y-2"
  enterTo="transform opacity-100 translate-y-0"
  leave="transition-all duration-300 ease-in"
  leaveFrom="transform opacity-100 translate-y-0"
  leaveTo="transform opacity-0 -translate-y-2"
>
  <ul className="pl-4">
    {/* Van Booking List only for users with Bookings:View */}
    {(isAdmin || hasPermissionFor("Bookings", "View")) && (
      <li
        className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
        onClick={() => navigate('/van/bookings')}
      >
        <FaList />
        <span>Van Booking List</span>
      </li>
    )}

    {/* Rider Claim is open to everyone who can see this panel */}
    <li
      className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
      onClick={() => navigate('/rider/claim')}
    >
      <FaCheck />
      <span>Rider Claim</span>
    </li>
    <li
      className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
      onClick={() => navigate('/my-jobs')}
    >
      <FaCheck />
      <span>My Claimed Jobs</span>
    </li>
  </ul>
</Transition>

                
                  {(isAdmin || hasPermissionFor("coupon", "View")) && (
  <li>
    <div
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
      onClick={() => handleDropdownToggle("coupon")}
    >
      <div className="flex items-center space-x-2">
        <FaTag /> {/* Changed from FaCartPlus to FaTag for better coupon representation */}
        <span>Coupon</span>
      </div>
      {dropdowns.coupon ? <FaAngleUp /> : <FaAngleDown />}
    </div>
    <Transition
      show={dropdowns.coupon}
      enter="transition-all duration-300 ease-out"
      enterFrom="transform opacity-0 -translate-y-2"
      enterTo="transform opacity-100 translate-y-0"
      leave="transition-all duration-300 ease-in"
      leaveFrom="transform opacity-100 translate-y-0"
      leaveTo="transform opacity-0 -translate-y-2"
    >
      <ul className="pl-4">
        {hasPermissionFor("customer_coupon", "Add") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/customer/coupon/add")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Add customer coupon</span>
          </li>
        )}
        {hasPermissionFor("customer_coupon", "View") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/customer/coupon/view")}
          >
            <FaListUl /> {/* Changed from FaPlusCircle */}
            <span>Customer Coupon List</span>
          </li>
        )}
        {hasPermissionFor("master_coupon", "Add") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/master/coupon/add")}
          >
            <FaTicketAlt /> {/* Changed from FaListAlt */}
            <span>Add Master Coupon</span>
          </li>
        )}
        {hasPermissionFor("master_coupon", "View") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/master/coupon/view")}
          >
            <FaClipboardList /> {/* Changed from FaMoneyBillWave */}
            <span>Master Coupon List</span>
          </li>
        )}
      </ul>
    </Transition>
  </li>
)}
        
{/* Audit feature */}
    

 {(isAdmin || hasPermissionFor("audit", "View")) && (
  <li>
    <div
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
      onClick={() => handleDropdownToggle("audit")}
    >
      <div className="flex items-center space-x-2">
        <FaTag /> {/* Changed from FaCartPlus to FaTag for better coupon representation */}
        <span>Audit</span>
      </div>
      {dropdowns.audit ? <FaAngleUp /> : <FaAngleDown />}
    </div>
    <Transition
      show={dropdowns.audit}
      enter="transition-all duration-300 ease-out"
      enterFrom="transform opacity-0 -translate-y-2"
      enterTo="transform opacity-100 translate-y-0"
      leave="transition-all duration-300 ease-in"
      leaveFrom="transform opacity-100 translate-y-0"
      leaveTo="transform opacity-0 -translate-y-2"
    >
      <ul className="pl-4">
        {hasPermissionFor("audit", "Add") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/audit")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Start Audit</span>
          </li>
        )}

         {hasPermissionFor("audit", "View") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/audit/open")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Current Audit List</span>
          </li>
        )}
        
         {hasPermissionFor("audit", "View") && (
          <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/audit/all")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Audit List</span>
          </li>
        )}
      </ul>
    </Transition>
  </li>
)}




          {/* order Dropdown */}
           {(isAdmin || hasPermissionFor("order", "View") ) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("order")}
            >
              <div className="flex items-center space-x-2">
                <FaCartPlus />
                <span>Order</span>
              </div>
              {dropdowns.order ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.order}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("posorders", "Add") && (
                  <li
                    className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/order/view")}
                  >
                    <FaCashRegister />
                    <span>Order List</span>
                  </li>
                )}
              
              
              </ul>
            </Transition>
          </li>
        )}

       {/* Contacts Dropdown */}
        {(isAdmin ||
          hasPermissionFor("customers", "Add") ||
          hasPermissionFor("customers", "View") ||
          hasPermissionFor("suppliers", "Add") ||
          hasPermissionFor("suppliers", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("contact")}
            >
              <div className="flex items-center space-x-2">
                <FaAddressBook />
                <span>Contacts</span>
              </div>
              {dropdowns.contact ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.contact}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="ml-4">
                {hasPermissionFor("customers", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/customer/new")}
                  >
                    <FaUserPlus className="mr-2" />
                    <span>New Customer</span>
                  </li>
                )}
                {hasPermissionFor("customers", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/customer/new/list")}
                  >
                    <FaUserPlus className="mr-2" />
                    <span>New Customer List</span>
                  </li>
                )}
                {hasPermissionFor("customers", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/customer/add")}
                  >
                    <FaUserPlus className="mr-2" />
                    <span>Add Customers</span>
                  </li>
                )}
                {hasPermissionFor("customers", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/customer/view")}
                  >
                    <FaList className="mr-2" />
                    <span>Customer List</span>
                  </li>
                )}
                {hasPermissionFor("suppliers", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/supplier/add")}
                  >
                    <FaPlusCircle className="mr-2" />
                    <span>Add Supplier</span>
                  </li>
                )}
                {hasPermissionFor("suppliers", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/supplier/view")}
                  >
                    <FaListUl className="mr-2" />
                    <span>Supplier List</span>
                  </li>
                  
                )}
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/address-manager")}  
                >
                  <FaAddressBook className="mr-2" />
                  <span>Address Manager</span>
                </li>
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/address-list")}
                >
                  <FaList className="mr-2" />
                  <span>Address List</span>
                </li>


              </ul>
            </Transition>
          </li>
        )}

        {/* image management  */}
  
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("imageManagement")}
            >
              <div className="flex items-center space-x-2">
                <FaDollarSign />
                <span>Image Management</span>
              </div>
              {dropdowns.imageManagement ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.imageManagement}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
               
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/item/image-management ")}
                  >
                    <FaPlusCircle />
                    <span>Item Image Management</span>
                  </li>
                
                
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/category/image-management")}
                  >
                    <FaListAlt />
                    <span>Category Image Management</span>
                  </li>
                
               
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/subcategory/image-management")}
                  >
                    <FaListAlt />
                    <span>SubCategory Image Management</span>
                  </li>
                
                 
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/subsubcategory/image-management")}
                  >
                    <FaListAlt />
                    <span>SubSubCategory Image Management</span>
                  </li>
                  
                
              </ul>
            </Transition>
          </li>
        

        {/* Advance Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("advance") : hasPermissionFor("AdvancePayment", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("advance")}
            >
              <div className="flex items-center space-x-2">
                <FaDollarSign />
                <span>Advance</span>
              </div>
              {dropdowns.advance ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.advance}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("AdvancePayment", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/add-advance")}
                  >
                    <FaPlusCircle />
                    <span>Add Advance</span>
                  </li>
                )}
                {hasPermissionFor("AdvancePayment", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/advance-list")}
                  >
                    <FaListAlt />
                    <span>Advance List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Banners Section */}
        {(isAdmin || hasPermissionFor("banners", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("banners")}
            >
              <div className="flex items-center space-x-2">
                <FaBullhorn />
                <span>Banners</span>
              </div>
              {dropdowns.banners ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.banners}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("banners", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/banners/add")}
                  >
                    <FaPlusCircle />
                    <span>Add Banners</span>
                  </li>
                )}
                
                {hasPermissionFor("banners", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/banners/view")}
                  >
                    <FaListAlt />
                    <span>banners List</span>
                  </li>
                )}
                {hasPermissionFor("Marketing_Items", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/marketingitem/add")}
                  >
                    <FaListAlt />
                    <span>Add Marketing Item</span>
                  </li>
                )}
                {hasPermissionFor("Marketing_Items", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/marketingitem/view")}
                  >
                    <FaListAlt />
                    <span> Marketing Item List</span>
                  </li>
                )}
              
                {hasPermissionFor("Product", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/product/add")}
                  >
                    <FaListAlt />
                    <span> Add Product</span>
                  </li>
                )}
                {hasPermissionFor("Product", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/product/view")}
                  >
                    <FaListAlt />
                    <span> Product List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Quotations Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("quotation") : hasPermissionFor("Quotations", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("quotation")}
            >
              <div className="flex items-center gap-2">
                <FaFileInvoice />
                <span>Quotations</span>
              </div>
              {dropdowns.quotation ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.quotation}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Quotations", "Add") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/newquotation")}
                  >
                    <FaPlusCircle />
                    <span>New Quotation</span>
                  </li>
                )}
                {hasPermissionFor("Quotations", "View") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/quotation-list")}
                  >
                    <FaListAlt />
                    <span>Quotation List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Delivery Slot Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("deliverySlot") : hasPermissionFor("DeliverySlot", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("deliverySlot")}
            >
              <div className="flex items-center space-x-2">
                <FaClock />
                <span>Delivery Slot</span>
              </div>
              {dropdowns.deliverySlot ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.deliverySlot}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("deliverySlot", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/delivery-slot/create")}
                  >
                   <MdAddAlarm />
                      <span>Create Slot</span>
                  </li>
                )}
                {hasPermissionFor("deliverySlot", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/delivery-slot/view")}
                  >
                    <MdViewList />
                    <span>Slot List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Coupons Dropdown */}
        {/*(isAdmin ? adminVisibleSections.includes("coupon") : (
          hasPermissionFor("Coupons", "View") ||
          hasPermissionFor("CustomerCoupons", "View")
        )) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("coupon")}
            >
              <div className="flex items-center gap-2">
                <FaTicketAlt />
                <span>Coupons</span>
              </div>
              {dropdowns.coupon ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.coupon}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("CustomerCoupons", "Add") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/create")}
                  >
                    <FaPlusCircle />
                    <span>Create Customer Coupon</span>
                  </li>
                )}
                {hasPermissionFor("CustomerCoupons", "View") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/customer-coupen-list")}
                  >
                    <FaListAlt />
                    <span>Customer Coupons List</span>
                  </li>
                )}
                {hasPermissionFor("Coupons", "Add") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/create-coupon")}
                  >
                    <FaPlusCircle />
                    <span>Create Coupon</span>
                  </li>
                )}
                {hasPermissionFor("Coupons", "View") && (
                  <li
                    className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/coupon-master")}
                  >
                    <FaListAlt />
                    <span>Coupons Master</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Purchase Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("purchase") : hasPermissionFor("Purchases", "View")) && (
          
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("purchase")}
            >
              <div className="flex items-center space-x-2">
                <FaCubes />
                <span>Purchase</span>
              </div>
              {dropdowns.purchase ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.purchase}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Purchases", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/new-purchase")}
                  >
                    <FaUserPlus />
                    <span>New Purchase</span>
                  </li>
                )}
                {hasPermissionFor("Purchases", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/purchase-list")}
                  >
                    <FaListAlt />
                    <span>Purchase List</span>
                  </li>
                )}
                {hasPermissionFor("Purchases", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/raw-lots")}
                  >
                    <FaBoxes />
                    <span>Raw Lots</span>
                  </li>
                )}
                {hasPermissionFor("PurchasesReturn", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/purchase-return ")}
                  >
                    <FaUndo />
                    <span>Purchase Return</span>
                  </li>
                )}
                {hasPermissionFor("PurchasesReturn", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/purchasereturn-list")}
                  >
                    <FaListAlt />
                    <span>Purchase Return List</span>
                  </li>
                                
                )}
                {hasPermissionFor("Purchases", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/bulk-purchase-upload")  }
                  >
                    <FaMoneyBillWave />
                    <span>Bulk Purchase</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Accounts Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("account") : hasPermissionFor("Accounts", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("account")}
            >
              <div className="flex items-center space-x-2">
                <FaThLarge />
                <span>Accounts</span>
              </div>
              {dropdowns.account ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.account}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Accounts", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/add-account")}
                  >
                    <FaUserPlus />
                    <span>Add Account</span>
                  </li>
                )}
                {hasPermissionFor("Accounts", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/account-list")}
                  >
                    <FaListAlt />
                    <span>Account List</span>
                  </li>
                )}
                {hasPermissionFor("Accounts", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/money-transfer-list")}
                  >
                    <FaExchangeAlt />
                    <span>Money Transfer</span>
                  </li>
                )}
                {hasPermissionFor("Accounts", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/deposit-list")}
                  >
                    <FaPiggyBank />
                    <span>Deposit List</span>
                  </li>
                )}
                {hasPermissionFor("Accounts", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/cash-transactions")}
                  >
                    <FaMoneyBillWave />
                    <span>Cash Transactions</span>
                  </li>
                )}
                 <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/account/rider/view")}
                  >
                    <FaMoneyBillWave />
                    <span>Rider Account List</span>
                  </li>
              </ul>
            </Transition>
          </li>
        )}

        {/* Terminal Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("terminal") : hasPermissionFor("Terminals", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("terminal")}
            >
              <div className="flex items-center space-x-2">
                <FaWarehouse />
                <span>Terminal</span>
              </div>
              {dropdowns.terminal ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.terminal}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Terminals", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/create-terminal")}
                  >
                    <FaPlusCircle />
                    <span>Add Terminal</span>
                  </li>
                )}
                {hasPermissionFor("Terminals", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/terminal-list")}
                  >
                    <FaListAlt />
                    <span>Terminal List</span>
                  </li>
                )}
                </ul>
            </Transition>
          </li>
        )}

         {/* Banners Section */}
        {(isAdmin || hasPermissionFor("banner", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("banners")}
            >
              <div className="flex items-center space-x-2">
                <FaBullhorn />
                <span>Banners</span>
              </div>
              {dropdowns.banners ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.banners}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("banner", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/banners/add")}
                  >
                    <FaPlusCircle />
                    <span>Add Banners</span>
                  </li>
                )}
                
                {hasPermissionFor("banner", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/banners/view")}
                  >
                    <FaListAlt />
                    <span>banners List</span>
                  </li>
                )}
                {hasPermissionFor("MarketingItems", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/marketingitem/add")}
                  >
                    <FaListAlt />
                    <span>Add Marketing Item</span>
                  </li>
                )}
                {hasPermissionFor("MarketingItems", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/marketingitem/view")}
                  >
                    <FaListAlt />
                    <span> Marketing Item List</span>
                  </li>
                )}
              
                {hasPermissionFor("Product", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/product/add")}
                  >
                    <FaListAlt />
                    <span> Add Product</span>
                  </li>
                )}
                {hasPermissionFor("Product", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/product/view")}
                  >
                    <FaListAlt />
                    <span> Product List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Places Dropdown - Visible only to admin */}
        {isAdmin && adminVisibleSections.includes("places") && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("places")}
            >
              <div className="flex items-center space-x-2">
                <FaStore />
                <span>Places</span>
              </div>
              {dropdowns.places ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.places}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Countries", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/add-country")}
                  >
                    <FaPlusCircle />
                    <span>Add Country</span>
                  </li>
                )}
                {hasPermissionFor("Countries", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/country-list")}
                  >
                    <FaListAlt />
                    <span>Country List</span>
                  </li>
                )}
                {hasPermissionFor("States", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/add-state")}
                  >
                    <FaPlusCircle />
                    <span>Add State</span>
                  </li>
                )}
                {hasPermissionFor("States", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/state-list")}
                  >
                    <FaListAlt />
                    <span>State List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Items Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("item") : (
          hasPermissionFor("Items", "Add") || hasPermissionFor("Items", "View")
        )) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("item")}
            >
              <div className="flex items-center space-x-2">
                <FaCubes />
                <span>Items</span>
              </div>
              {dropdowns.item ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.item}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Items", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/items/add")}
                  >
                    <FaPlusSquare />
                    <span>Add Item</span>
                  </li>
                )}
                {hasPermissionFor("Items", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/items/new")}
                  >
                    <FaPlusSquare />
                    <span>NEW Item</span>
                  </li>
                )}
                {hasPermissionFor("Services", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/services/add")}
                  >
                    <FaTools />
                    <span>Add Service</span>
                  </li>
                )}
                {hasPermissionFor("Items", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/item-list")}
                  >
                    <FaListAlt />
                    <span>Items List</span>
                  </li>
                )}
                {hasPermissionFor("Categories", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/categories-list")}
                  >
                    <FaLayerGroup />
                    <span>Categories List</span>
                  </li>
                )}
                {hasPermissionFor("Brands", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/brands-list")}
                  >
                    <FaTags />
                    <span>Brands List</span>
                  </li>
                )}
                {hasPermissionFor("Variants", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/variants-list")}
                  >
                    <FaShapes />
                    <span>Variants List</span>
                  </li>
                )}
                {hasPermissionFor("Items", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/print-labels")}
                  >
                    <FaPrint />
                    <span>Print Labels</span>
                  </li>
                )}
                {hasPermissionFor("Items", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/import-items")}
                  >
                    <FaFileImport />
                    <span>Import Items</span>
                  </li>
                )}
                {hasPermissionFor("Services", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/import-services")}
                  >
                    <FaFileImport />
                    <span>Import Services</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Stock Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("stock") : hasPermissionFor("StockAdjustments", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("stock")}
            >
              <div className="flex items-center space-x-2">
                <FaHourglassEnd />
                <span>Stock</span>
              </div>
              {dropdowns.stock ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.stock}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("StockAdjustments", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/adjustment-list")}
                  >
                    <FaTools />
                    <span>Adjustment List</span>
                  </li>
                )}
                {hasPermissionFor("StockTransfers", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/transfer-list")}
                  >
                    <FaExchangeAlt />
                    <span>Transfer List</span>
                  </li>
                )}
                {hasPermissionFor("StockTransfers", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/bulk-transfer")}
                  >
                    <FaPlusCircle />
                    <span>Bulk Transfer</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Expenses Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("expense") : hasPermissionFor("Expenses", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("expense")}
            >
              <div className="flex items-center space-x-2">
                <FaCube />
                <span>Expenses</span>
              </div>
              {dropdowns.expense ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.expense}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Expenses", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/expense-list")}
                  >
                    <FaListAlt />
                    <span>Expenses List</span>
                  </li>
                )}
                {hasPermissionFor("ExpenseCategories", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/expense-category-list")}
                  >
                    <FaFolderOpen />
                    <span>Categories List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Stores Dropdown - Visible only to admin */}
        {isAdmin && adminVisibleSections.includes("store") && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("store")}
            >
              <div className="flex items-center space-x-2">
                <FaStore />
                <span>Stores</span>
              </div>
              {dropdowns.store ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.store}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/store/add")}
                >
                  <FaPlusCircle />
                  <span>Add Store</span>
                </li>
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/store/view")}
                >
                  <FaListUl />
                  <span>Store List</span>
                </li>
              </ul>
            </Transition>
          </li>
        )}

        {/* Reports Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("reports") : hasPermissionFor("report", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("reports")}
            >
              <div className="flex items-center space-x-2">
                <FaChartBar />
                <span>Reports</span>
              </div>
              {dropdowns.reports ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.reports}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {reportsList.map((report, index) => (
                  <li
                    key={index}
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate(report.path)}
                  >
                    <FaFileAlt />
                    <span>{report.name}</span>
                  </li>
                ))}
              </ul>
            </Transition>
          </li>
        )}

        {/* Warehouse Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("warehouse") : hasPermissionFor("Warehouses", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("warehouse")}
            >
              <div className="flex items-center space-x-2">
                <FaWarehouse />
                <span>Warehouse</span>
              </div>
              {dropdowns.warehouse ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.warehouse}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                {hasPermissionFor("Warehouses", "Add") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/warehouse-form")}
                  >
                    <FaPlusCircle />
                    <span>Add Warehouse</span>
                  </li>
                )}
                {hasPermissionFor("Warehouses", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => navigate("/Warehouse-list")}
                  >
                    <FaListUl />
                    <span>Warehouse List</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}

        {/* Messages Dropdown */}
        <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("message")}
            >
              <div className="flex items-center space-x-2">
                <FaEnvelope />
                <span>Messages</span>
              </div>
              {dropdowns.message ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.message}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/chat-panel")}
                >
                  <FaPaperPlane />
                  <span>Send Message</span>
                </li>
                </ul>
            </Transition>
          </li>
          
            


        {/* Messages Dropdown */}
        {/*(isAdmin ? adminVisibleSections.includes("message") : hasPermissionFor("SendMessages", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("message")}
            >
              <div className="flex items-center space-x-2">
                <FaEnvelope />
                <span>Messages</span>
              </div>
              {dropdowns.message ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.message}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="pl-4">
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/send-message")}
                >
                  <FaPaperPlane />
                  <span>Send Message</span>
                </li>
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/message-templates-list")}
                >
                  <FaFileAlt />
                  <span>Messaging Templates</span>
                </li>
              </ul>
            </Transition>
          </li>
        )}

        {/* Settings Dropdown - Visible to all, sub-items permission-based */}
        <li>
          <div
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
            onClick={() => handleDropdownToggle("settings")}
          >
            <div className="flex items-center space-x-2">
              <FaCogs />
              <span>Settings</span>
            </div>
            {dropdowns.settings ? <FaAngleUp /> : <FaAngleDown />}
          </div>
          <Transition
            show={dropdowns.settings}
            enter="transition-all duration-300 ease-out"
            enterFrom="transform opacity-0 -translate-y-2"
            enterTo="transform opacity-100 translate-y-0"
            leave="transition-all duration-300 ease-in"
            leaveFrom="transform opacity-100 translate-y-0"
            leaveTo="transform opacity-0 -translate-y-2"
          >
            <ul className="pl-4">
              {hasPermissionFor("store", "Add") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/store")}
                >
                  <FaStore />
                  <span>Store</span>
                </li>
              )}
              {hasPermissionFor("settings", "View") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/sms-api")}
                >
                  <FaSms />
                  <span>SMS/WhatsApp API</span>
                </li>
              )}
              {hasPermissionFor("Taxes", "View") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/tax-list")}
                >
                  <FaPercentage />
                  <span>Tax List</span>
                </li>
              )}
              {hasPermissionFor("Units", "View") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/units-list")}
                >
                  <FaBalanceScale />
                  <span>Units List</span>
                </li>
              )}
              {hasPermissionFor("PaymentTypes", "View") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/payment-types-list")}
                >
                  <FaCreditCard />
                  <span>Payment Types</span>
                </li>
              )}
              {hasPermissionFor("Settings", "View") && (
                <li
                  className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                  onClick={() => navigate("/change-password")}
                >
                  <FaKey />
                  <span>Change Password</span>
                </li>
              
              )}
              <li
                className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
               
                onClick={() => navigate("/bluetooth-printer")}
              >
                <FaBluetoothB />
                <span>Bluetooth Printer</span>
              </li>
            </ul>
          </Transition>
        </li>
        {/* Pending Deletion Requests (admin only) */}
{isAdmin && (
  <li>
    <div
      className="flex items-center p-2 cursor-pointer hover:bg-gray-700"
      onClick={() => navigate("/admin/deletion-requests")}
    >
      <FaListUl className="mr-2" />
      <span>Pending Delete Requests</span>
    </div>
  </li>
)}

        {/* Help Dropdown */}
        {(isAdmin ? adminVisibleSections.includes("help") : hasPermissionFor("help", "View")) && (
          <li>
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => handleDropdownToggle("help")}
            >
              <div className="flex items-center space-x-2">
                <FaQuestionCircle />
                <span>Help</span>
              </div>
              {dropdowns.help ? <FaAngleUp /> : <FaAngleDown />}
            </div>
            <Transition
              show={dropdowns.help}
              enter="transition-all duration-300 ease-out"
              enterFrom="transform opacity-0 -translate-y-2"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition-all duration-300 ease-in"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <ul className="ml-4">
                {hasPermissionFor("help", "View") && (
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => window.location.href = "https://pos.agribioj.com/help/"}
                  >
                    <FaQuestionCircle />
                    <span>Help Center</span>
                  </li>
                )}
              </ul>
            </Transition>
          </li>
        )}
      </ul>
    </div>
    
  );
};

export default Sidebar;