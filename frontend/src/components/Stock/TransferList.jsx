import React, { useState, useEffect } from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../Loading.jsx';
import { useNavigate } from 'react-router-dom';

const StockTransferList = () => {
  const Navigate = useNavigate();
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [transfers, setTransfer] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/stock-transfers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      setTransfer(response.data.data);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter data
  const filteredData = transfers
    .filter(item => item._id.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by createdAt descending (latest first)

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCopy = () => {
    const data = currentUsers.map(transfer => `${new Date(transfer.createdAt).toDateString()},${transfer.fromWarehouse.warehouseName},${transfer.toWarehouse.warehouseName},${transfer.details},${transfer.note},${transfer.createdBy}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transfer list");
    XLSX.writeFile(wb, "TransferList.xlsx");
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(user => Object.values(user).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stockTransferlist.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Stock_Transfer List", 20, 20);
    const tableData = filteredData.map(transfer => [
      new Date(transfer.createdAt).toDateString(),
      transfer.fromWarehouse.warehouseName,
      transfer.toWarehouse.warehouseName,
      transfer.details,
      transfer.note,
      transfer.createdBy
    ]);

    autoTable(doc, {
      head: [['Transfer Date', 'From Warehouse', 'To Warehouse', 'Details', 'Note', 'Created By']],
      body: tableData,
    });

    doc.save("advance_list.pdf");
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handledelete = async (e, id) => {
    e.preventDefault();
    const conf = window.confirm("Do you want to delete this Expense?");
    if (!conf) return;

    try {
      const response = await fetch(`/api/stock-transfers/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      console.log("Purchase deleted successfully!");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting purchase:", error.message);
    }
  };

  if (loading) return <LoadingScreen />;

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
        <div className={`overflow-x-auto flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Stock Transfer List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Sold Items</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
              <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Stock Transfer List</a>
            </nav>
          </header>
          <div className="p-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            <header className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Stock Transfer List</h1>
              <button className="px-4 py-2 text-white rounded bg-cyan-500" onClick={() => Navigate('/stock-transfer')}><span className='font-bold'>+</span> New Transfer</button>
            </header>

            <div className="flex flex-col justify-between w-full mt-4 mb-4 space-y-2 lg:flex-row lg:space-y-0 lg:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entries} onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setCurrentPage(1);
                }}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col justify-around w-full gap-2 lg:flex-row">
                <div className='flex items-center justify-around flex-1 w-full gap-1 px-2'>
                  <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                  <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                  <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                  <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                  <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm md:w-auto" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left border">Transfer Date</th>
                    <th className="px-3 py-2 text-left border">From Warehouse</th>
                    <th className="px-3 py-2 text-left border">To Warehouse</th>
                    <th className="px-3 py-2 text-left border">Details</th>
                    <th className="px-3 py-2 text-left border">Note</th>
                    <th className="px-3 py-2 text-left border">Created by</th>
                    <th className="px-3 py-2 text-left border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-center">No data available in table</td>
                    </tr>
                  ) : (
                    currentUsers.map((transfer, index) => (
                      <tr key={transfer._id} className="hover:bg-gray-100">
                        <td className="px-3 py-2 border">{new Date(transfer.createdAt).toDateString()}</td>
                        <td className="px-3 py-2 border">{transfer.fromWarehouse?.warehouseName || "NA"}</td>
                        <td className="px-3 py-2 border">{transfer.toWarehouse?.warehouseName || "NA"}</td>
                        <td className="px-3 py-2 border">{transfer.details}</td>
                        <td className="px-3 py-2 border">{transfer.note}</td>
                        <td className="px-3 py-2 border">{transfer.createdBy}</td>
                        <td className="relative px-3 py-2 border">
                          <button
                            onClick={() => {
                              setDropdownIndex(dropdownIndex === transfer._id ? null : transfer._id);
                            }}
                            className="px-3 py-1 text-white transition rounded bg-cyan-600 hover:bg-cyan-700"
                          >
                            Action ▼
                          </button>
                          {dropdownIndex === transfer._id && (
                            <div
                              className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-36 animate-fade-in"
                            >
                              <button
                                className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
                                onClick={() => Navigate(`/stock-transfer?id=${transfer._id}`)}
                              >
                                <FaEdit className="mr-2" /> Edit
                              </button>
                              <button
                                className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
                                onClick={(e) => handledelete(e, transfer._id)}
                              >
                                <FaTrash className="mr-2" /> Delete
                              </button>
                              <button
                                className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
                                onClick={() => Navigate(`/transfer-details/${transfer._id}`)}
                              >
                                <FaEye className="mr-2" /> View
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
              <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, transfers.length)} of {transfers.length} entries</span>
              <div>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTransferList;