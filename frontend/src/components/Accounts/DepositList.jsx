import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const DepositList = () => {
  const navigate=useNavigate();
  // State variables for filters and data
  const [currentPage, setCurrentPage] = useState(1);
  const [depositDate, setDepositDate] = useState('');
  const [debitAccount, setDebitAccount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [users, setUsers] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const[actionMenu,setActionMenu]=useState(null);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const fetchData = async () => {
    try {
      const response = await axios.get('api/deposits', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
      console.log(response.data);
      setDeposits(response.data.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute filtered data based on search and filters.
  const filteredData = deposits.filter(item => {
    const search = searchTerm.trim().toLowerCase() || "";
    const debitMatch = item.debitAccount?.accountNumber?.toLowerCase().includes(search) || false;
    const creditMatch = item.creditAccount?.accountNumber?.toLowerCase().includes(search) || false;
    const nameMatch = item.creatorName ? item.creatorName.toLowerCase().includes(search) : false;
    const dateMatch = depositDate
      ? item.depositDate && new Date(item.depositDate).toDateString() === new Date(depositDate).toDateString()
      : true;
    // Add more filters for debit/credit account if necessary.
    return (search === "" || debitMatch || creditMatch || nameMatch) && dateMatch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentDeposits = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const handleEntriesChange=(e)=>{
    setEntriesPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
  const handlePageChange = (newPage) =>  {
    if(newPage >=1 && newPage <=totalPages )
    setCurrentPage(newPage);
  }

  // Calculate total amount of current deposits
  const calculateTotal = () => {
    const total = currentDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    setTotalAmount(total);
  };

  useEffect(() => {
    calculateTotal();
  }, [filteredData, currentDeposits]);

  // Export functions
  const handleCopy = () => {
    const copyData = deposits.map(deposit => 
      `${deposit.referenceNo}\t${new Date(deposit.depositDate).toDateString()}\t${deposit.debitAccount?.accountNumber || "NA"}\t${deposit.creditAccount?.accountNumber || "NA"}\t${deposit.amount}\t${deposit.creatorName || "NA"}`
    ).join('\n');
    navigator.clipboard.writeText(copyData);
    alert('Data copied to clipboard');
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      deposits.map(deposit => 
        `${deposit.referenceNo},${new Date(deposit.depositDate).toDateString()},${deposit.debitAccount?.accountNumber || "NA"},${deposit.creditAccount?.accountNumber || "NA"},${deposit.amount},${deposit.creatorName || "NA"}`
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "deposits.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Deposit List", 14, 16);
    const data = deposits.map(deposit => [
      deposit.referenceNo,
      new Date(deposit.depositDate).toDateString(),
      deposit.debitAccount?.accountNumber || "NA",
      deposit.creditAccount?.accountNumber || "NA",
      deposit.amount,
      deposit.creatorName || "NA",
      new Date(deposit.createdAt).toDateString()
    ]);
    autoTable(doc, {
      head: [['Reference No.', 'Deposit Date', 'Debit Account', 'Credit Account', 'Amount', 'Created By', 'Created At']],
      body: data,
    });
    doc.save("deposits.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(deposits);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deposits");
    XLSX.writeFile(workbook, "deposits.xlsx");
  };

  const handleToggleColumns = () => {
    alert("Column toggling functionality is not implemented.");
  };
  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete this ?")
    if(!conf){
      return ;
    }
    try {
      const response = await axios.delete(`api/deposits/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    fetchData();
    } catch (error) {
      console.error( error.message);
    }
    
  };
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div className="w-auto">
          
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex flex-col items-center justify-between px-2 py-2 mb-2 bg-gray-100 shadow rouded-md sm:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Deposit List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Deposits</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0 sm:space-x-3">
              <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </a>
              <BiChevronRight className="mx-1 " />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Deposit List</a>
            </nav>
          </header>

          <div className="flex items-center justify-between p-4 mt-1 mb-4 border-t-4 rounded-lg border-cyan-500">
            <div></div>
            <div>
              <Link to="/add-deposit" className="px-4 py-2 text-white no-underline transition rounded bg-cyan-500 hover:bg-cyan-600">
                <span className="text-lg">+</span> Create Deposit
              </Link>
              <Link to="/account-list" className="bg-green-600 text-white px-4 py-2 rounded">
                <span className="text-lg">+</span> Account List
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex-col items-start md:flex-row md:items-center">
            <div className="flex flex-wrap justify-between space-y-2">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Deposit Date</label>
                <input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-48 p-2 border" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Debit Account</label>
                <select value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} className="w-48 p-2 border">
                  <option value="">Select</option>
                  <option value="all">ALL</option>
                  {deposits.map((item, index) => (
                    <option key={index} value={item.debitAccount?.accountNumber.toLowerCase()}>
                      {item.debitAccount?.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Credit Account</label>
                <select value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} className="w-48 p-2 border">
                  <option value="">Select</option>
                  <option value="all">ALL</option>
                  {deposits.map((item, index) => (
                    <option key={index} value={item.creditAccount?.accountNumber.toLowerCase()}>
                      {item.creditAccount?.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Users</label>
                <select value={users} onChange={(e) => setUsers(e.target.value)} className="w-48 p-2 border">
                  <option value="All">All</option>
                  <option>Admin</option>
                  <option>Manager</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Controls Section */}
          <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 lg:flex-row lg:space-y-0 lg:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={handleEntriesChange}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2 px-2'>
                <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

          {/* Deposit Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full mt-4 border border-collapse border-gray-300">
              <thead className="text-sm bg-gray-200 md:text-base">
                <tr>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Reference No.</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Deposit Date</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Debit Account</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Credit Account</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Amount</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Created by</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Created at</th>
                  <th className="p-2 border border-gray-300 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentDeposits.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-4 text-center">No data available</td>
                  </tr>
                ) : (
                  currentDeposits.map((deposit) => (
                    <tr key={deposit._id} className="text-sm md:text-base">
                      <td className="p-2 border border-gray-300">{deposit.referenceNo || "NA"}</td>
                      <td className="p-2 border border-gray-300">{new Date(deposit.depositDate).toDateString()}</td>
                      <td className="p-2 border border-gray-300">{deposit.debitAccount?.accountNumber || "NA"}</td>
                      <td className="p-2 border border-gray-300">{deposit.creditAccount?.accountNumber || "NA"}</td>
                      <td className="p-2 border border-gray-300">{deposit.amount}</td>
                      <td className="p-2 border border-gray-300">{deposit.creatorName || "NA"}</td>
                      <td className="p-2 border border-gray-300">{new Date(deposit.createdAt).toDateString()}</td>
                      <td className="p-2 border border-gray-300">
                      <button
className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
            hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
onClick={() => {
  if (actionMenu) setActionMenu(null);
  else setActionMenu(deposit._id);
}}
>
<span>Action</span>
<svg
  className={`w-4 h-4 transition-transform duration-200 ${
    actionMenu === deposit._id ? "rotate-180" : ""
  }`}
  fill="none"
  stroke="currentColor"
  strokeWidth={2}
  viewBox="0 0 24 24"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
</button>


                      {actionMenu === deposit._id && (
                        <div className="absolute z-50 mt-2 bg-white border shadow-lg t-0 w-28">
                          <button 
                          className="w-full px-1 py-0 text-left text-green-500 hover:bg-gray-100"
                           onClick={()=>navigate(`/add-deposit?id=${deposit._id}`)}> 
                            
                            ✏️ Edit
                          </button>
                          <button
                            className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
                            onClick={() => handleDelete(deposit._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
            </td>
          </tr>
        ))
      )}
              
                {filteredData.length > 0 && (
                  <tr className="font-bold md:text-base">
                    <td className="p-2 text-right border border-gray-300" colSpan="5">Total:</td>
                    <td className="p-2 text-right border border-gray-300">{totalAmount}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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
  );
};

export default DepositList;
