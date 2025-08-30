import React, { useEffect, useState } from 'react';
import { ShoppingBagIcon, CashIcon } from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FaDollarSign } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FaTachometerAlt } from "react-icons/fa";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

async function fetchLiveQty(warehouseId, inventoryId) {
  const token = localStorage.getItem("token");
  const { data } = await axios.get(
    `/api/stock/${inventoryId}`,
    {
      params: { warehouse: warehouseId },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return (data?.currentStock ?? data?.openingStock ?? 0);
}

const PurchaseOverview = () => {
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [purchaseList, setPurchaseList] = useState([]);
  const [show, setShow] = useState(null);
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [localPermissions, setLocalPermissions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try { setLocalPermissions(JSON.parse(stored)); } catch {}
    }
  }, []);

  function hasPermissionFor(module, action) {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(p =>
      p.module.toLowerCase() === module.toLowerCase() &&
      p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );
  }

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [window.innerWidth]);

  const fetchPurchaseList = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    if (!token) {
      console.log("No token found redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get("api/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Purchase List");
      console.log(response.data);
      if (response.data.data) {
        // Sort by purchaseDate (newest to oldest) and then by referenceNo (highest to lowest)
        const sortedData = response.data.data.sort((a, b) => {
          // First sort by purchaseDate (descending)
          const dateComparison = new Date(b.purchaseDate) - new Date(a.purchaseDate);
          if (dateComparison !== 0) return dateComparison;
          // If dates are equal, sort by referenceNo (descending)
          return (b.referenceNo || "").localeCompare(a.referenceNo || "");
        });
        setPurchaseList(sortedData);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get("api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Warehouse");
      console.log(response.data);
      if (response.data.data) {
        const newWarehouse = response.data.data.map((warehouse) => ({
          label: warehouse.warehouseName,
          value: warehouse._id,
        }));
        setWarehouse(newWarehouse);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculate = () => {
    const filteredList = show === "all" || !show
      ? purchaseList
      : purchaseList.filter(item => item.warehouse?._id === show);

    const totalAmount = filteredList.reduce((sum, item) => sum + item.grandTotal, 0);
    const totalPaid = filteredList.reduce((sum, item) =>
      sum + (item.payments?.length > 0 ? parseFloat(item.payments[0].amount) : 0),
      0
    );

    setTotal(totalAmount);
    setPaid(totalPaid);
  };

  useEffect(() => {
    setTotal(0);
    calculate();
  }, [show, purchaseList]);

  useEffect(() => {
    fetchPurchaseList();
    fetchWarehouses();
    calculate();
  }, []);

  const handleDelete = async (id) => {
    const conf = window.confirm(
      "Delete this purchase? This will reverse the received quantities back out of stock."
    );
    if (!conf) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // 1) Get the full purchase (must include warehouse + items)
      //    If your list already has those fields, you can skip this GET
      const { data: detail } = await axios.get(`/api/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const purchase = detail?.data || detail?.purchase || detail;
      const whId = purchase?.warehouse?._id || purchase?.warehouse;
      const rows = purchase?.items || [];

      if (!whId || rows.length === 0) {
        throw new Error("Could not read purchase details (warehouse/items missing).");
      }

      // 2) Preflight: would deleting make stock negative?
      const checks = await Promise.all(
        rows.map(async (row) => {
          const invId = row.variant || row.item?._id || row.item; // variant-aware
          const live = await fetchLiveQty(whId, invId);
          const need = Number(row.quantity ?? row.receivedQty ?? 0);

          if (live < need) {
            return {
              name: row.item?.itemName || row.itemName || invId,
              live,
              need,
            };
          }
          return null;
        })
      );

      const blockers = checks.filter(Boolean);
      if (blockers.length) {
        const msg = blockers
          .map((b) => `• ${b.name}: need ${b.need}, available ${b.live}`)
          .join("\n");
        alert(
          "Cannot delete this purchase. Deleting would make stock negative for:\n\n" + msg
        );
        setLoading(false);
        return;
      }

      // 3) Safe → proceed with delete
      await axios.delete(`/api/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchPurchaseList();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (item) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Purchase Details", 10, 10);

    // Purchase details table
    autoTable(doc, {
      startY: 20,
      head: [['Field', 'Value']],
      body: [
        ['Date', new Date(item.purchaseDate).toLocaleDateString()],
        ['Code', item.purchaseCode || "N/A"],
        ['Status', item.status || "N/A"],
        ['Reference No', item.referenceNo || "N/A"],
        ['Warehouse', item.warehouse?.warehouseName || "N/A"],
        ['Supplier', item.supplier?.supplierName || item.supplier?.email || "No supplier"],
        ['Grand Total', `₹${(item.grandTotal || 0).toFixed(2)}`],
        ['Other Charges', `₹${(item.otherCharges || 0).toFixed(2)}`],
        ['Discount on All', `₹${(item.discountOnAll || 0).toFixed(2)}`],
        ['Paid Amount', `₹${(item.payments?.length > 0 ? item.payments[0].amount : 0).toFixed(2)}`],
        ['Payment Status', item.payments?.length > 0
          ? (item.grandTotal || 0) === (item.payments[0].amount || 0) ? "Paid"
          : (item.grandTotal || 0) > (item.payments[0].amount || 0) ? "Pending"
          : "Overpaid"
          : "Pending"],
        ['Payment Note', item.payments?.[0]?.paymentNote || "N/A"],
        ['Created By', `${item.createdByModel} ${item.createdBy?.name || `${item.createdBy?.FirstName} ${item.createdBy?.LastName}` || "N/A"}`],
        ['Note', item.note || "N/A"],
      ],
    });

    // Items table
    const items = item.items || [];
    if (items.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Item Name', 'Quantity', 'Purchase Price', 'MRP', 'Discount', 'Total Amount']],
        body: items.map(item => [
          item.item?.itemName || item.item?.name || "N/A",
          item.quantity || "N/A",
          `₹${(item.purchasePrice || 0).toFixed(2)}`,
          `₹${(item.mrp || 0).toFixed(2)}`,
          `₹${(item.discount || 0).toFixed(2)}`,
          `₹${(item.totalAmount || 0).toFixed(2)}`,
        ]),
      });
    }

    doc.save(`purchase_${item.purchaseCode || "details"}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="overflow-x-auto flex flex-col p-2 md:p-2 min-h-screen w-full">
          <header className="flex flex-col items-center justify-between p-4 mb-6 bg-gray-100 rounded-lg md:flex-row">
            <h1 className="text-2xl font-semibold">Purchase List <span className="text-gray-500 text-sm/6">View/Search Purchase</span></h1>
            <div className="flex items-center space-x-2 text-blue-600">
              <Link to="/" className="flex items-center text-gray-500 no-underline hover:text-cyan-600 text-sm/6">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600"/> Home
              </Link>
              <span className="text-gray-400">{">"}</span>
              <Link to="/brands" className="text-gray-500 no-underline hover:text-cyan-600 text-sm/6">Purchase List</Link>
            </div>
          </header>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex items-center text-black bg-white rounded-lg shadow-md ">
                <ShoppingBagIcon className="w-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-2xl">{(show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length}</h2>
                  <p>Total Invoices</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FaDollarSign className="w-16 h-16 text-white rounded bg-cyan-500"/>
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-2xl">₹{paid}</h2>
                  <p>Total Paid Amount</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <FontAwesomeIcon icon={faMoneyBill} className="w-16 h-16 text-white rounded bg-cyan-500" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-2xl">₹{total}</h2>
                  <p>Total Invoices Amount</p>
                </div>
              </div>
              <div className="flex items-center text-black bg-white rounded-lg shadow-md">
                <CashIcon className="h-16 text-white rounded bg-cyan-500 w-18" />
                <div className="flex flex-col justify-center ml-4">
                  <h2 className="text-2xl font-medium">₹{total - paid}</h2>
                  <p>Total Purchase Due</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between w-full gap-4 mt-3 md:flex-row md:gap-28">
            <div className="flex w-full px-4 py-2 bg-white border border-gray-300 rounded-md md:w-64">
              <div className="flex items-center w-full gap-4">
                <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-red-500" />
                <select
                  className="flex-grow text-gray-700 bg-transparent outline-none cursor-pointer"
                  onChange={(e) => setShow(e.target.value)}
                >
                  <option value="all">All Warehouse</option>
                  {warehouse.map((warehouse, index) => (
                    <option key={index} value={warehouse.value}>
                      {warehouse.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {hasPermissionFor("Purchases", "Add") && (
              <button className="w-full px-2 py-2 text-white transition rounded-md md:w-auto bg-cyan-300 hover:bg-cyan-500" onClick={() => navigate("/new-purchase")}>
                <span className="font-bold">+ </span>Create Purchase
              </button>
            )}
          </div>

          <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm">Entries</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex items-center justify-between flex-1 gap-2">
                <button className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
              </div>
              <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  {[
                    'Purchase Date', 'Purchase Code', 'Purchase Status', 'Reference No.',
                    'Supplier Name', 'Total', 'Paid Payment', 'Payment Status', 'Created by', 'Action'
                  ].map((header) => (
                    <th key={header} className="px-4 py-2 font-medium text-left border">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length > 0
                  ? (show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show))
                    .map((item) => {
                      const paymentStatus = item.payments?.length > 0
                        ? item.grandTotal === item.payments[0].amount ? "Paid"
                        : item.grandTotal > item.payments[0].amount ? "Pending"
                        : "Overpaid"
                        : "Pending";
                      const supplierName = item.supplier?.supplierName || item.supplier?.email || "No supplier";
                      return (
                        <tr className="font-bold bg-gray-100" key={item._id}>
                          <td className="px-4 py-2 font-medium text-left border">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2 font-medium text-left border">{item.purchaseCode}</td>
                          <td className="px-4 py-2 font-medium text-left border">{item.status}</td>
                          <td className="px-4 py-2 font-medium text-left border">{item.referenceNo}</td>
                          <td className="px-4 py-2 font-medium text-left border">{supplierName}</td>
                          <td className="px-4 py-2 font-medium text-left border">{item.grandTotal}</td>
                          <td className="px-4 py-2 font-medium text-left border">
                            {item.payments?.length > 0 ? `${item.payments[0].amount.toFixed(2)}` : "No Payment"}
                          </td>
                          <td className="px-4 py-2 font-medium text-left border">{paymentStatus}</td>
                          <td className="px-4 py-2 font-medium text-left border">{item.createdByModel}</td>
                          <td className="relative px-4 py-2 font-medium text-center border">
                            <button
                              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
                                hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                              onClick={(e) => {
                                if (actionMenu?.id === item._id) setActionMenu(null);
                                else {
                                  const buttonRect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - buttonRect.bottom;
                                  const menuHeight = 120; // Approximate height of the menu
                                  setActionMenu({ id: item._id, position: spaceBelow < menuHeight ? 'above' : 'below' });
                                }
                              }}
                            >
                              <span>Action</span>
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  actionMenu?.id === item._id ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {actionMenu?.id === item._id && (
                              <div
                                className="absolute right-0 z-40 bg-white border shadow-lg w-28"
                                style={{
                                  top: actionMenu.position === 'below' ? '100%' : 'auto',
                                  bottom: actionMenu.position === 'above' ? '100%' : 'auto',
                                }}
                              >
                                {hasPermissionFor("Purchases", "Edit") && (
                                  <button
                                    className="w-full px-1 py-0 text-left text-green-500 hover:bg-gray-100"
                                    onClick={() => navigate(`/new-purchase?id=${item._id}`)}
                                  >
                                    ✏️ Edit
                                  </button>
                                )}
                                {hasPermissionFor("Purchases", "View") && (
                                  <button
                                    className="w-full px-1 py-0 text-left text-blue-500 hover:bg-gray-100"
                                    onClick={() => navigate(`/purchase-detail/${item._id}`)}
                                  >
                                    👁️ View
                                  </button>
                                )}
                                <button
                                  className="w-full px-1 py-0 text-left text-gray-500 hover:bg-gray-100"
                                  onClick={() => handlePrint(item)}
                                >
                                  🖨️ Print
                                </button>
                                {hasPermissionFor("Purchases", "Delete") && (
                                  <button
                                    className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
                                    onClick={() => handleDelete(item._id)}
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  : (
                    <tr>
                      <td colSpan="10" className="py-4 font-semibold text-center border">No Data Available</td>
                    </tr>
                  )}
                {(show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length > 0 && (
                  <tr className="font-bold bg-gray-100">
                    <td colSpan="5" className="text-center border">Total</td>
                    <td className="text-center border">{total}</td>
                    <td className="text-center border">{paid}</td>
                    <td className="text-center border"></td>
                    <td className="text-center border"></td>
                    <td className="text-center border"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
            <div className="flex justify-between w-full md:w-auto md:gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOverview;