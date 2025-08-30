import React, { useState, useEffect } from 'react';
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from "react-icons/fa";

const AdvanceList = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [advance, setAdvance] = useState([]);
  const navigate = useNavigate();
  const [dropdownIndex, setDropdownIndex] = useState(null);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])
  const toggleDropdown = (id) => {
    setDropdownIndex(dropdownIndex === id ? null : id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('api/advance-payments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("API response:", response.data);
      setAdvance(response.data.data || []);
    } catch (err) {
      console.error("Error fetching advance payments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this advance payment?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/advance-payments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Deleted Successfully");
    } catch (error) {
      console.error("Error deleting advance payment:", error.message);
    } finally {
      fetchData();
      setLoading(false);
    }
  };

  // Filter data based on searchTerm
  const filteredData = advance.filter(item => 
    item._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages)
      setCurrentPage(newPage);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Export functions (Copy, Excel, PDF, Print, CSV) remain unchanged...

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex">
        <div className="w-auto">
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex flex-col items-start justify-between p-0 mb-6 md:flex-row md:items-center">
            <h2 className="text-lg font-bold md:text-xl">Advance Payments List</h2>
            <nav className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600 md:mt-0">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline">
                <FaTachometerAlt className="mr-1" />
                Home
              </NavLink>
              <span>&gt;</span>
              <NavLink to="/customer/view" className="text-gray-700 no-underline">
                Customer List
              </NavLink>
              <span>&gt;</span>
              <NavLink to="/advance-list" className="text-gray-700 no-underline">
                Advance Payment List
              </NavLink>
            </nav>
          </header>

          {/* Filters Section */}
          <div className="p-4 mb-4 bg-white border-t-4 rounded shadow border-cyan-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advance Payments</h3>
              <button className="px-4 py-1 mt-2 text-white rounded bg-cyan-400 hover:bg-cyan-600 md:mt-0" onClick={() => navigate('/create-advance')}>
                + Create Advance
              </button>
            </div>
            <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={handleEntriesChange}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2'>
                <button 
                // onClick={handleCopy}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button 
                // onClick={handleExcelDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button
                //  onClick={handlePdfDownload}
                  className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button 
                // onClick={handlePrint}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button 
                // onClick={handleCsvDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            

            {/* Advance Payments Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full bg-white border-collapse rounded-md shadow-lg">
                <thead className="text-sm bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Customer Name</th>
                    <th className="px-4 py-2 border">Amount</th>
                    <th className="px-4 py-2 border">Payment Type</th>
                    <th className="px-4 py-2 border">Created By</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-sm text-center text-gray-500">No data available in table</td>
                    </tr>
                  ) : (
                    currentUsers.map((transfer) => (
                      <tr key={transfer._id} className="border-t">
                        <td className="px-4 py-2 border">{transfer._id}</td>
                        <td className="px-4 py-2 border">{new Date(transfer.createdAt).toDateString()}</td>
                        <td className="px-4 py-2 border">{transfer.customer?.customerName || transfer.customerName || "N/A"}</td>
                        <td className="px-4 py-2 border">{transfer.amount}</td>
                        <td className="px-4 py-2 border">{transfer.paymentType?.paymentTypeName || "NA"}</td>
                        <td className="px-4 py-2 border">{transfer.createdBy?.name || transfer.creatorName || "N/A"}</td>
                        <td className="relative px-4 py-2 border">
                          <button className="px-3 py-1 text-white rounded bg-cyan-600" onClick={() => toggleDropdown(transfer._id)}>
                            Action ▼
                          </button>
                          {dropdownIndex === transfer._id && (
                            <div className="absolute right-0 z-10 w-32 mt-1 bg-white border border-gray-200 rounded-md shadow-md">
                              <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100" onClick={() => navigate(`/add-advance?id=${transfer._id}`)}>
                                <FaEdit className="mr-2" /> Edit
                              </button>
                              <button className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100" onClick={() => handleDelete(transfer._id)}>
                                <FaTrash className="mr-2" /> Delete
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
            <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
              <span>                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries</span>              </span>
              <div className='flex justify-between w-full md:w-auto md:gap-2'>
              <button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
    ${currentPage === 1 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
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
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
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
    </div>
  );
};

export default AdvanceList;
