import React, { useState, useEffect } from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt, FaEdit, FaTrash } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../Loading.jsx';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
const StockAdjustmentList = () => {
  const navigate=useNavigate()
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage,setEntriesPerPage] = useState(10);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAdjustments, setSelectedAdjustments] = useState({});
const[show,setShow]=useState("all")
const[loading,setLoading]=useState(false)
  const [adjustments, setAdjustments] = useState([]);
const[warehouse,setWarehouse]=useState([])
const[searchTerm,setSearchTerm]=useState("")
const[dropdownIndex,setDropdownIndex]=useState(null)
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])


  const handleCheckboxChange = (e, index) => {
    const newSelectedAdjustments = { ...selectedAdjustments, [index]: e.target.checked };
    setSelectedAdjustments(newSelectedAdjustments);
  };

  
 
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token");
      const response = await axios.get(`api/stock-adjustments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      setAdjustments(response.data.data);
    } catch (err) {
      console.log(err.message);
    } 
    finally{
      setLoading(false)
    }
  };

  const filteredData = adjustments.filter(item => 
    // item.customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item._id.toLowerCase().includes(searchTerm.toLowerCase()) &&
   (  show==="" || show==="all"  || show===item.warehouse._id)
  );
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);
  
  const handlePageChange = (newPage) =>  {
    if(newPage >=1 && newPage <=totalPages )
    setCurrentPage(newPage);
  }
  const handleEntriesChange=(e)=>{
    setEntriesPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
  


  
  const fetchWareHouse = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token");
      const response = await axios.get("api/warehouses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      const newWarehouse = response.data.data.map((wh) => ({
        label: wh.warehouseName,
        value: wh._id,
      }));
      setWarehouse(newWarehouse);
    } catch (err) {
      console.log(err.message);
    } 
    finally{
      setLoading(false)
    }
  };


 const handleCopy = () => {
    const data = filteredData.map(adjustment => `${new Date(adjustment.adjustmentDate).toDateString()},${adjustment.referenceNo},${adjustment.createdBy}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "adjustmentlist list");
    XLSX.writeFile(wb, "adjustmentlist.xlsx");
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(user => Object.values(user).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stockAdjustmentlist.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handlePrint = () => {
    window.print();
  };


 const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 20, 20);
    const tableData = filteredData.map(adjustment => [
      new Date(adjustment.adjustmentDate).toDateString(),
      adjustment.referenceNo,
      adjustment.createdBy
    ]);

    autoTable(doc, {
      head: [['Adjustment Date','Refernce No','Created By']],
      body: tableData,
    });

    doc.save("advance_list.pdf");
  };
  
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchExpenses();
        await fetchWareHouse();
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

 const handledelete = async (id) => {
  const conf = window.confirm("Do you want to delete this ?");
  if (!conf) return;
  
  try {
      const response = await fetch(`api/stock-adjustments/${id}`, {
          method: "DELETE",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      });

      if (!response.ok) {
          throw new Error("Failed to delete ");
      }
  
      console.log("Stock adjustment deleted successfully!");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting stock adjustment:", error.message);
    }
  };

   
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="flex flex-grow md:flex-row">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />
        {/* Content */}
        <div className={`flex-grow  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Stock Adjustment List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Stock Adjustments</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a href="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </a>
              <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
              {/* Use /stock-adjustment as the list route */}
              <a href="/stock-adjustment" className="text-gray-700 no-underline hover:text-cyan-600">
                Stock Adjustment
              </a>
            </nav>
          </header>

          <div className="flex flex-wrap-reverse items-center justify-between gap-2 p-4 mb-4 border-t-4 rounded-lg border-cyan-500">
            <div className="mr-4">
              <select className="p-2 border border-gray-300 rounded" onChange={(e)=>setShow(e.target.value)}>
                <option value="all">-All Warehouses-</option>
                {warehouse.map((wh, index) => (
                  <option key={index} value={wh.value}>
                    {wh.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
            <Link
                to="/stock-adjustment"
                className="flex items-center justify-center w-full px-2 text-white no-underline rounded-md bg-cyan-500 md:w-auto"
              >
                <button className="w-full px-2 text-white rounded-md bg-cyan-500 md:w-auto">
                  + New Stock Adjustment
                </button>
              </Link>
            </div>
          </div>

      <div className="flex flex-col justify-between mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select className="p-2 text-sm border border-gray-300" onChange={handleEntriesChange}>
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
          <span className="text-sm">Entries</span>
        </div>
        <div className="flex flex-wrap gap-0.5 ">
        
          <button className="px-4 py-2 text-sm text-white bg-cyan-500"onClick={handleCopy}>Copy</button>
          <button className="px-4 py-2 text-sm text-white bg-cyan-500"onClick={handleExcelDownload}>Excel</button>
          <button className="px-4 py-2 text-sm text-white bg-cyan-500"onClick={handlePdfDownload}>PDF</button>
          <button className="px-4 py-2 text-sm text-white bg-cyan-500"onClick={handlePrint}>Print</button>
          <button className="px-4 py-2 text-sm text-white bg-cyan-500"onClick={handleCsvDownload}>CSV</button>
          {/* <button className="px-4 py-2 text-sm text-white bg-cyan-500">Columns</button> */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full p-2 text-sm border border-gray-300 md:w-auto"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 text-sm border md:text-base">Select</th>
              <th className="px-4 py-2 text-sm border md:text-base">Adjustment Date</th>
              <th className="px-4 py-2 text-sm border md:text-base">Reference No.</th>
              <th className="px-4 py-2 text-sm border md:text-base">Created by</th>
              <th className="px-4 py-2 text-sm border md:text-base">Action</th>
            </tr>
          </thead>
          <tbody>
           
            {currentUsers.length>0?
      currentUsers.map((adjustment,index) => (
        <tr key={adjustment._id} className="hover:bg-gray-100">
        <td className="px-4 py-2 border">
          <input
            type="checkbox"
            checked={!!selectedAdjustments[index]}
            onChange={(e) => handleCheckboxChange(e, index)}
            className="text-cyan-500"
          />
        </td>
        <td className="px-4 py-2 text-sm border md:text-base">{new Date(adjustment.adjustmentDate).toDateString()}</td>
        <td className="px-4 py-2 text-sm border md:text-base">{adjustment.referenceNo}</td>
        <td className="px-4 py-2 text-sm border md:text-base">{adjustment.createdBy}</td>
        <td className="relative flex justify-center p-2 border">
    <button
      onClick={() => {
        setDropdownIndex(dropdownIndex === adjustment._id ? null : adjustment._id);
      }}
      className="px-3 py-1 text-white transition rounded bg-cyan-600 hover:bg-cyan-700"
    >
      Action ▼
    </button>

    {dropdownIndex === adjustment._id && (
      <div
        // ref={dropdownRef}
        className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-36 animate-fade-in"
      >
        <button
          className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
          onClick={() => navigate(`/stock-adjustment?id=${adjustment._id}`)}
        >
          <FaEdit className="mr-2" /> Edit
        </button>
        <button
          className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
          onClick={() => handledelete(adjustment._id)}
        >
          <FaTrash className="mr-2" /> Delete
        </button>
      </div>
    )}
  </td>
      </tr>
      ))
    : (
      <tr>
        <td colSpan="10" className="py-4 font-semibold text-center border">No Data Available</td>
      </tr>
    )
  }
          </tbody>
        </table>
        <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
              <p className="text-sm">Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, adjustments.length)} of {adjustments.length} entries</p>
              <div className="flex gap-1">
                <button
                  className={`px-2 py-1 rounded ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                {/* <span className="px-3 py-1 text-white bg-blue-500 rounded">{currentPage}</span> */}
                <button
                  className={`px-2 py-1 rounded ${currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
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


export default StockAdjustmentList;
