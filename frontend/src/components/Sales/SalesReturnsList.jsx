import React, { useEffect, useState } from 'react';
import { ShoppingBagIcon, CashIcon } from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FaDollarSign, FaTachometerAlt } from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Select from 'react-select';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";

const SalesReturnList = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [warehouse, setWarehouse] = useState("all");
  const [salesReturns, setSalesReturns] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, totalRefunded: 0 });
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenu, setActionMenu] = useState(null);
  const [localPermissions, setLocalPermissions] = useState([]);

  // Permissions
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) setLocalPermissions(JSON.parse(stored));
  }, []);
  const hasPermissionFor = (module, action) => {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(p =>
      p.module.toLowerCase() === module.toLowerCase() &&
      p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // Sidebar responsiveness
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Fetch Sales Returns
  const fetchSalesReturnList = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get("api/sales-return", authHeaders());
      setSalesReturns(response.data.returns || []);
      setSummary(response.data.summary || { totalCount: 0, totalRefunded: 0 });
    } catch (error) {
      alert("Failed to fetch sales returns: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Warehouses
  const fetchWarehouses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get("api/warehouses", authHeaders());
      const newWarehouses = [
        { label: "All Warehouses", value: "all" },
        ...response.data.data.map(wh => ({
          label: wh.warehouseName,
          value: wh._id,
        })),
      ];
      setWarehouses(newWarehouses);
    } catch (error) {
      alert("Failed to fetch warehouses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturnList();
    fetchWarehouses();
  }, []);

  // Filter data
  const filteredData = salesReturns.filter(item => {
    const warehouseCondition = warehouse === "all" || item.warehouse?._id === warehouse;
    const searchCondition =
      item.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.returnCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sale?.saleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sale?.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return warehouseCondition && searchCondition;
  });

  // Delete handler
  const handleDelete = async (id) => {
    if (!hasPermissionFor("SalesReturn", "Delete")) {
      alert("You don’t have permission to delete sales returns.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this return?");
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await axios.delete(`api/sales-return/${id}`, authHeaders());
      fetchSalesReturnList();
    } catch (error) {
      alert("Failed to delete return: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleCopy = () => {
    const data = filteredData.map(sale => {
      const transactionCode = sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A";
      return `${new Date(sale.returnDate).toDateString()},${sale.returnCode},${transactionCode},${sale.status},${sale.customer?.customerName || "N/A"},${sale.totalRefund || 0},${sale.payments?.[0]?.amount || 0},${sale.payments?.[0]?.paymentNote || "N/A"},${sale.creatorName || "N/A"}`;
    }).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const data = filteredData.map(sale => ({
      "Return Date": new Date(sale.returnDate).toDateString(),
      "Return Code": sale.returnCode,
      "Transaction Code": sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      "Status": sale.status,
      "Customer Name": sale.customer?.customerName || "N/A",
      "Total Refund": sale.totalRefund || 0,
      "Paid Amount": sale.payments?.[0]?.amount || 0,
      "Payment Note": sale.payments?.[0]?.paymentNote || "N/A",
      "Created By": sale.creatorName || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesReturns");
    XLSX.writeFile(wb, "sales_returns.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Sales Returns List", 20, 20);
    const tableData = filteredData.map(sale => [
      new Date(sale.returnDate).toDateString(),
      sale.returnCode,
      sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      sale.status,
      sale.customer?.customerName || "N/A",
      sale.totalRefund || 0,
      sale.payments?.[0]?.amount || 0,
      sale.payments?.[0]?.paymentNote || "N/A",
      sale.creatorName || "N/A",
    ]);
    autoTable(doc, {
      head: [
        ["Return Date", "Return Code", "Transaction Code", "Status", "Customer Name", "Total Refund", "Paid Amount", "Payment Note", "Created By"]
      ],
      body: tableData,
    });
    doc.save("sales_returns.pdf");
  };

  const handleCsvDownload = () => {
    const headers = ["Return Date,Return Code,Transaction Code,Status,Customer Name,Total Refund,Paid Amount,Payment Note,Created By"];
    const data = filteredData.map(sale => [
      new Date(sale.returnDate).toDateString(),
      sale.returnCode,
      sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      sale.status,
      sale.customer?.customerName || "N/A",
      sale.totalRefund || 0,
      sale.payments?.[0]?.amount || 0,
      sale.payments?.[0]?.paymentNote || "N/A",
      sale.creatorName || "N/A",
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [...headers, ...data].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_returns.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Calculate totals
  const calculate = () => {
    const totalRefund = currentItems.reduce((sum, item) => sum + (Number(item.totalRefund) || 0), 0);
    const paidAmount = currentItems.reduce((sum, item) => sum + (Number(item.payments?.[0]?.amount) || 0), 0);
    setTotal(totalRefund);
    setPaid(paidAmount);
  };

  useEffect(() => {
    calculate();
  }, [currentItems]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />
        {/* Content */}
        <div className="flex-1 p-4 overflow-x-auto">
          {/* Header */}
          <header className="flex flex-col items-center justify-between w-full px-2 py-2 mb-4 bg-gray-100 rounded-md shadow md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Sales Returns List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Returns</span>
            </div>
            <nav className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <span>  </span>
              <NavLink to="/sales-payment-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Sales Returns List
              </NavLink>
            </nav>
          </header>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <ShoppingBagIcon className="w-12 h-12 text-white bg-cyan-500 rounded" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">{summary.totalCount}</h2>
                <p className="font-semibold">Total Returns</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <FaDollarSign className="w-12 h-12 text-white bg-cyan-500 rounded" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{summary.totalRefunded.toFixed(2)}</h2>
                <p className="font-semibold">Total Refunded Amount</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <FontAwesomeIcon icon={faMoneyBill} className="w-12 h-12 text-white bg-cyan-500 rounded" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{paid.toFixed(2)}</h2>
                <p className="font-semibold">Total Paid Amount</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <CashIcon className="w-12 h-12 text-white bg-cyan-500 rounded" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{(total - paid).toFixed(2)}</h2>
                <p className="font-semibold">Total Return Due</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col items-center justify-between gap-4 mb-4 md:flex-row">
            <div className="w-full md:w-64">
              <label className="block font-semibold text-gray-700">Warehouse</label>
              <Select
                options={warehouses}
                value={warehouses.find(w => w.value === warehouse)}
                onChange={(option) => setWarehouse(option.value)}
              />
            </div>
            <button
              className="px-4 py-2 text-white bg-cyan-500 rounded hover:bg-cyan-600"
              onClick={() => navigate('/sales-return/add')}
            >
              + Create Return
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-between mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                className="p-2 text-sm border rounded"
                value={entriesPerPage}
                onChange={handleEntriesChange}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span className="text-sm">Entries</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white bg-cyan-500 rounded">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white bg-cyan-500 rounded">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white bg-cyan-500 rounded">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white bg-cyan-500 rounded">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white bg-cyan-500 rounded">CSV</button>
              </div>
              <input
                type="text"
                placeholder="Search by Customer or Return Code"
                className="p-2 text-sm border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-100 border">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Return Date</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Return Code</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Transaction Code</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Status</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Customer Name</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Total Refund</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Paid Amount</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Payment Note</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Created By</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500 border">
                      No returns available
                    </td>
                  </tr>
                ) : (
                  currentItems.map((sale) => {
                    const returnDate = sale.returnDate ? new Date(sale.returnDate).toDateString() : "N/A";
                    const transactionCode = sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A";
                    const status = sale.status || "N/A";
                    const customerName = sale.customer?.customerName || "N/A";
                    const totalRefund = Number(sale.totalRefund) || 0;
                    const paidAmount = Number(sale.payments?.[0]?.amount) || 0;
                    const paymentNote = sale.payments?.[0]?.paymentNote || "N/A";
                    const creator = sale.creatorName || "N/A";

                    return (
                      <tr key={sale._id} className="bg-white">
                        <td className="px-4 py-2 border">{returnDate}</td>
                        <td className="px-4 py-2 border">{sale.returnCode}</td>
                        <td className="px-4 py-2 border">{transactionCode}</td>
                        <td className="px-4 py-2 border">{status}</td>
                        <td className="px-4 py-2 border">{customerName}</td>
                        <td className="px-4 py-2 border">₹{totalRefund.toFixed(2)}</td>
                        <td className="px-4 py-2 border">₹{paidAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 border">{paymentNote}</td>
                        <td className="px-4 py-2 border">{creator}</td>
                        <td className="relative px-4 py-2 border">
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full hover:bg-cyan-700"
                            onClick={() => setActionMenu(actionMenu === sale._id ? null : sale._id)}
                          >
                            Action
                            <svg
                              className={`w-4 h-4 transition-transform ${actionMenu === sale._id ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {actionMenu === sale._id && (
                            <div className="absolute right-0 z-10 w-32 mt-2 bg-white border rounded shadow-lg">
                              
                              {hasPermissionFor("SalesReturn", "Edit") && (
                                <button
                                  className="w-full px-4 py-2 text-left text-green-500 hover:bg-gray-100"
                                  onClick={() => navigate(`/sales-return/edit/${sale._id}`)}
                                >
                                  ✏️ Edit
                                </button>
                              )}
                              {hasPermissionFor("SalesReturn", "Delete") && (
                                <button
                                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100"
                                  onClick={() => handleDelete(sale._id)}
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
                )}
                {currentItems.length > 0 && (
                  <tr className="font-bold bg-gray-100">
                    <td colSpan={5} className="px-4 py-2 text-right border">Total:</td>
                    <td className="px-4 py-2 border">₹{total.toFixed(2)}</td>
                    <td className="px-4 py-2 border">₹{paid.toFixed(2)}</td>
                    <td colSpan={3} className="px-4 py-2 border"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-start justify-between gap-2 p-2 md:flex-row md:items-center">
            <span>
              Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                  currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                  currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
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

export default SalesReturnList;