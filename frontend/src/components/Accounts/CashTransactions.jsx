import React, { useState, useEffect } from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';

const API_BASE = "api";

const CashTransactions = () => {
  // State variables
  const [startDate, setStartDate] = useState('2025-05-01'); // Default to May 1, 2025
  const [endDate, setEndDate] = useState('2025-05-14'); // Default to today
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [amount, setAmount] = useState(0);
  const [transfers, setTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountWarehouseMap, setAccountWarehouseMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storeId = localStorage.getItem("storeId") || "";
  const token = localStorage.getItem("token") || "";
  axios.defaults.headers.common = { Authorization: `Bearer ${token}` };

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch warehouses and accounts
  useEffect(() => {
    if (!storeId) {
      setError("No store ID found. Please log in again.");
      return;
    }

    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/accounts`),
      axios.get(`${API_BASE}/warehouses`)
    ])
      .then(([accRes, whRes]) => {
        // Filter warehouses by storeId
        const storeWarehouses = (whRes.data.data || []).filter(w => w.store === storeId);
        setWarehouses(storeWarehouses);

        // Create warehouse map
        const warehouseMap = {};
        storeWarehouses.forEach(w => {
          warehouseMap[w._id] = w;
        });

        // Filter accounts based on warehouse mappings
        const accountPromises = (accRes.data.data || []).map(acc =>
          axios
            .get(`${API_BASE}/by-cash-account/${acc._id}`)
            .then(res => {
              const warehouseId = res.data.warehouseId;
              const warehouse = warehouseMap[warehouseId];
              if (warehouse && warehouse.store === storeId) {
                setAccountWarehouseMap(prev => ({
                  ...prev,
                  [acc._id]: {
                    warehouseId,
                    warehouseName: warehouse.warehouseName
                  }
                }));
                return acc;
              }
              return null;
            })
            .catch(err => {
              console.error(`Error fetching by-cash-account for account ${acc._id}:`, err.message);
              return null;
            })
        );

        Promise.all(accountPromises).then(results => {
          const filteredAccounts = results.filter(acc => acc);
          setAccounts(filteredAccounts);
          if (filteredAccounts.length === 0) {
            setError("No accounts found for warehouses in the current store.");
          }
        });
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to fetch accounts or warehouses.");
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // Fetch cash sales from API
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cash-sale-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          start: startDate,
          end: endDate,
          ...(warehouseFilter && { warehouseId: warehouseFilter }),
          ...(accountFilter && { accountId: accountFilter }),
        },
      });
      setTransfers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching cash sales:', err.message);
      alert('Failed to fetch cash sales');
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, warehouseFilter, accountFilter]);

  // Filter data based on search term
  const filteredData = transfers.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.warehouse?.name?.toLowerCase() || '').includes(search) ||
      (item.account?.name?.toLowerCase() || '').includes(search) ||
      (item.referenceId?.toLowerCase() || '').includes(search)
    );
  });

  // Calculate total amount
  useEffect(() => {
    const total = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
    setAmount(total);
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Export functions (unchanged)
  const handleCopy = () => {
    const copyData = filteredData
      .map(item => {
        const items = item.items?.length
          ? item.items.map(i => `${i.itemName || 'Unknown'} (${i.quantity || 0})`).join(', ')
          : 'No items';
        return `${item.date},${item.amount},${item.warehouse?.name || 'N/A'},${item.account?.name || 'N/A'},${items},${item.referenceId},${item.refModel}`;
      })
      .join('\n');
    navigator.clipboard.writeText(copyData);
    alert('Data copied to clipboard');
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Date,Amount,Warehouse,Account,Items,Reference ID,Reference Model\n" +
      filteredData
        .map(item => {
          const items = item.items?.length
            ? item.items.map(i => `${i.itemName || 'Unknown'} (${i.quantity || 0})`).join('; ')
            : 'No items';
          return `${item.date},${item.amount},${item.warehouse?.name || 'N/A'},${item.account?.name || 'N/A'},${items},${item.referenceId},${item.refModel}`;
        })
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cash_sales.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Cash Sales List", 14, 16);

    const data = filteredData.map(item => [
      item.date,
      item.amount,
      item.warehouse?.name || 'N/A',
      item.account?.name || 'N/A',
      item.items?.length
        ? item.items.map(i => `${i.itemName || 'Unknown'} (${i.quantity || 0})`).join(', ')
        : 'No items',
      item.referenceId,
      item.refModel,
    ]);

    autoTable(doc, {
      head: [['Date', 'Amount', 'Warehouse', 'Account', 'Items', 'Reference ID', 'Reference Model']],
      body: data,
    });

    doc.save("cash_sales.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = filteredData.map(item => ({
      Date: item.date,
      Amount: item.amount,
      Warehouse: item.warehouse?.name || 'N/A',
      Account: item.account?.name || 'N/A',
      Items: item.items?.length
        ? item.items.map(i => `${i.itemName || 'Unknown'} (${i.quantity || 0})`).join(', ')
        : 'No items',
      'Reference ID': item.referenceId,
      'Reference Model': item.refModel,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CashSales");
    XLSX.writeFile(workbook, "cash_sales.xlsx");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-grow">
        {/* Sidebar */}
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        {/* Content */}
        <div className="overflow-x-auto flex flex-col p-2 md:p-2 min-h-screen w-full">
          {/* Header Section */}
          <header className="flex flex-col items-center justify-between px-2 py-2 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Cash Sales</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Cash Sales</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </a>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Cash Sales</a>
            </nav>
          </header>

          {/* Filters Section */}
          <div className="flex-col items-start p-4 border-t-4 rounded-lg md:flex-row md:items-center border-cyan-500">
            <div className="flex flex-wrap justify-start space-y-2 md:space-x-4 md:space-y-0">
              {/* Start Date Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-64 p-2 border"
                />
              </div>

              {/* End Date Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-64 p-2 border"
                />
              </div>

              {/* Warehouse Filter Dropdown */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Warehouse</label>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="w-64 p-2 border"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

             

              
            </div>
          </div>

          {/* Table Controls Section */}
          <div className="flex flex-col items-center justify-between mt-4 lg:flex-row">
            {/* Entries Per Page Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-2 border"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <label className="text">Entries</label>
            </div>

            {/* Table Actions */}
            <div className="flex items-center space-x-0.5 mt-2 lg:mt-0 w-full">
              <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white transition bg-cyan-500 hover:bg-cyan-600">Copy</button>
              <button onClick={handleExportExcel} className="w-full px-3 py-2 text-sm text-white transition bg-cyan-500 hover:bg-cyan-600">Excel</button>
              <button onClick={handleExportPDF} className="w-full px-3 py-2 text-sm text-white transition bg-cyan-500 hover:bg-cyan-600">PDF</button>
              <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white transition bg-cyan-500 hover:bg-cyan-600">Print</button>
              <button onClick={handleExportCSV} className="w-full px-3 py-2 text-sm text-white transition bg-cyan-500 hover:bg-cyan-600">CSV</button>
            </div>
          </div>

          {/* Cash Sales Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full mt-4 border border-collapse border-gray-300">
              <thead className="bg-gray-200">
                <tr className="text-sm md:text-base">
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Date</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Amount</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Warehouse</th>

                  <th className="p-2 border border-gray-300 whitespace-nowrap">Items</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Reference ID</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Reference Model</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center">No data available</td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr key={item.referenceId} className="text-sm md:text-base">
                      <td className="p-2 border border-gray-300">{item.date}</td>
                      <td className="p-2 border border-gray-300">{item.amount}</td>
                      <td className="p-2 border border-gray-300">{item.warehouse?.name || 'N/A'}</td>
                      
                      <td className="p-2 border border-gray-300">
                        {item.items?.length
                          ? item.items.map(i => `${i.itemName || 'Unknown'} (${i.quantity || 0})`).join(', ')
                          : 'No items'}
                      </td>
                      <td className="p-2 border border-gray-300">{item.referenceId}</td>
                      <td className="p-2 border border-gray-300">{item.refModel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Amount */}
          <div className="mt-4 text-sm font-semibold">
            Total Amount: {amount.toFixed(2)}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
            <span>
              Showing {entriesPerPage * (currentPage - 1) + 1} to{' '}
              {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex justify-between w-full md:w-auto md:gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
                  ${currentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
                  ${currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'}`}
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

export default CashTransactions;