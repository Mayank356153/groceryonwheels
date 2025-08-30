import React, { useState, useEffect } from 'react';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios from 'axios';
import Select from 'react-select';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../Loading.jsx';

const QuotationList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [qoutation, setQoutation] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null); // State to manage dropdown visibility

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const fetchWarehouses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found redirecting...");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get("api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.data) {
        const newwarehouse = [
          { label: "All", value: "all" },
          ...response.data.data.map(warehouse => ({
            label: warehouse.warehouseName,
            value: warehouse._id,
          }))
        ];
        setWarehouses(newwarehouse);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotation = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found redirecting...");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get("api/quotation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQoutation(response.data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchQuotation();
  }, []);

  const filteredData = qoutation.filter(item => {
    const warehouseCondition = warehouse === "all" || warehouse === "" || item.warehouse?._id === warehouse;
    const customerCondition = item.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const start = startDate
      ? item.quotationDate && new Date(item.quotationDate).toDateString() >= new Date(startDate).toDateString()
      : true;
    const end = endDate
      ? item.quotationDate && new Date(item.quotationDate).toDateString() <= new Date(endDate).toDateString()
      : true;
    return warehouseCondition && customerCondition && start && end;
  });

  const calculate = () => setTotal(filteredData.reduce((sum, quote) => sum + quote.grandTotal, 0));
  useEffect(() => { calculate(); }, [filteredData]);

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
    const data = qoutation.map(quotation => `${new Date(quotation.quotationDate).toDateString()}, ${new Date(quotation.expiryDate).toDateString()}, ${quotation.quotationCode},${quotation.referenceNo},${quotation.customer?.customerName || "NA"},${quotation.grandTotal}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(qoutation);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quotation List");
    XLSX.writeFile(wb, "Quotation_list.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Quotation List", 20, 20);
    const tableData = qoutation.map(quotation => [
      new Date(quotation.quotationDate).toDateString(),
      new Date(quotation.expiryDate).toDateString(),
      quotation.quotationCode,
      quotation.referenceNo,
      quotation.customer?.customerName || "NA",
      quotation.grandTotal
    ]);
    autoTable(doc, {
      head: [['Quotation Date', 'Expire Date', 'Quotation Code', 'Reference No.', 'Customer Name', 'Total']],
      body: tableData,
    });
    doc.save('quotation.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + qoutation.map(exp => Object.values(exp).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quotation_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    const conf = window.confirm("Do you want to delete this?");
    if (!conf) return;
    setLoading(true);
    try {
      await axios.delete(`api/quotation/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Deleted Successfully");
    } catch (error) {
      console.error(error.message);
    } finally {
      await fetchQuotation();
      setLoading(false);
    }
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className={`flex-grow mt-24 flex flex-col p-2 md:p-2 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row bg-gray">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Quotation List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Sold Items</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
              <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Quotation List</a>
            </nav>
          </header>
          <div className="flex justify-end mb-4">
            <button onClick={() => navigate('/newquotation')} className="px-4 py-2 mt-2 text-white transition rounded-md bg-cyan-500 hover:bg-cyan-600">
              Create Quotation
            </button>
          </div>
          <div className="flex flex-col mb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="block mb-1 font-bold text-sm/6">Warehouse<span className='text-red-500'>*</span></label>
                  <Select options={warehouses} onChange={(selectedOption) => setWarehouse(selectedOption.value)} />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-sm/6">From Date</label>
                  <input type="date" className="w-full px-4 py-2 border rounded" onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-sm/6">To Date</label>
                  <input type="date" className="w-full px-4 py-2 border rounded" onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-sm/6">Users</label>
                  <select value={users} onChange={(e) => setUsers(e.target.value)} className="w-full px-4 py-2 border rounded">
                    <option value="All">All</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between p-2 mt-2 bg-white rounded shadow-md md:flex-row">
            <div className="flex items-center gap-1">
              <span className="text-sm">Show</span>
              <select value={entriesPerPage} onChange={handleEntriesChange} className="p-2 border rounded">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm">Entries</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-0.5 mt-1 md:mt-0">
              <button className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleCopy}>Copy</button>
              <button className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleExcelDownload}>Excel</button>
              <button className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handlePdfDownload}>PDF</button>
              <button className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handlePrint}>Print</button>
              <button className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleCsvDownload}>CSV</button>
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-2 py-2 border rounded" />
            </div>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-sm">
              <thead>
                <tr className="bg-gray-400">
                  {['Quotation Date', 'Expire Date', 'Quotation Code', 'Reference No.', 'Customer Name', 'Total', 'Created by', 'Action'].map(header => (
                    <th key={header} className="px-4 py-2 text-left border text-sm/6 sm:text-sm">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentUsers.length <= 0 ? (
                  <tr><td colSpan="8" className="p-4 text-center text-gray-500 border">No data available in table</td></tr>
                ) : (
                  currentUsers.map((quotation) => (
                    <tr className="bg-gray-100" key={quotation._id}>
                      <td className="text-center border">{new Date(quotation.quotationDate).toDateString()}</td>
                      <td className="text-center border">{quotation.expiryDate ? new Date(quotation.expiryDate).toDateString() : 'N/A'}</td>
                      <td className="text-center border">{quotation.quotationCode}</td>
                      <td className="text-center border">{quotation.referenceNo}</td>
                      <td className="text-center border">{quotation.customer?.customerName || "NA"}</td>
                      <td className="text-center border">{quotation.grandTotal}</td>
                      <td className="text-center border">NA</td>
                      <td className="text-center border relative">
                        <button
                          className="px-2 py-1 text-white bg-gray-500 rounded hover:bg-gray-600"
                          onClick={() => toggleDropdown(quotation._id)}
                        >
                          Action
                        </button>
                        {dropdownOpen === quotation._id && (
                          <div className="absolute z-10 right-0 mt-2 w-32 bg-white border rounded shadow-lg">
                            <button
                              className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                              onClick={() => {
                                navigate(`/quotation/edit/${quotation._id}`);
                                setDropdownOpen(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                              onClick={() => {
                                handleDelete(quotation._id);
                                setDropdownOpen(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {currentUsers.length > 0 && (
                <tfoot>
                  <tr className="gap-1">
                    {['', '', '', '', 'Total', total, '', ''].map((footer, index) => (
                      <td key={index} className={`border px-4 py-2 font-bold bg-gray-400 ${index === 4 ? 'text-right' : 'text-left'}`}>
                        {footer}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, qoutation.length)} of {qoutation.length} entries</span>
            <div>
              <button onClick={() => handlePageChange(currentPage - 1)} className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>
                Previous
              </button>
              <button onClick={() => handlePageChange(currentPage + 1)} className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationList;