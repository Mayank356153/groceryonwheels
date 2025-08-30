import React, { useState,useEffect } from 'react'; // Importing React and useState hook for state management
import { Link } from 'react-router-dom'; // Importing Link component for navigation
import { BiChevronRight } from 'react-icons/bi'; 
import { FaTachometerAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf'; // Importing jsPDF for PDF generation
import autoTable from 'jspdf-autotable'; // Importing autoTable for tabular data in PDFs
import * as XLSX from 'xlsx'; // Importing xlsx for Excel export
import Navbar from "../Navbar.jsx"; 
import Sidebar from "../Sidebar.jsx"; 
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { useNavigate } from 'react-router-dom';
// MoneyTransferList Component
const MoneyTransferList = () => {
  const navigate=useNavigate();
    // State variables to manage filters and settings
    const [transferDate, setTransferDate] = useState(''); 
    const [debitAccount, setDebitAccount] = useState(''); 
    const [creditAccount, setCreditAccount] = useState(''); 
    const [users, setUsers] = useState('All'); 
    const [entriesPerPage, setEntriesPerPage] = useState(10); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const[transfers,setTransfers]=useState([])
  const[loading,setLoading]=useState(false)
  const[currentPage,setCurrentPage]=useState(1)
  const[actionMenu,setActionMenu]=useState(null)
    const fetchData = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/money-transfers', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          
          console.log(response.data)
         setTransfers(response.data.data)
         
          
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
      
      const filteredData = transfers.filter(item => {
        const search = searchTerm?.trim().toLowerCase() || "";
    
        // Allow partial matches for search
        const debitAccountMatch = item.debitAccount?.accountNumber?.toLowerCase()?.includes(search) || false;
        const creditAccountMatch = item.creditAccount?.accountNumber?.toLowerCase()?.includes(search) || false;
        const creditAccountNameMatch = item.creditAccount?.accountName?.toLowerCase()?.includes(search) || false;
        const debitAccountNameMatch = item.debitAccount?.accountName?.toLowerCase()?.includes(search) || false;
    
        // Handle filters (allow "all" or empty filters)
        const credit = creditAccount === "all" || !creditAccount || item.creditAccount?.accountNumber?.toLowerCase() === creditAccount;
        const debit = debitAccount === "all" || !debitAccount || item.debitAccount?.accountNumber?.toLowerCase() === debitAccount;
    
       
        // Ensure transferDate matches (or allow all if not provided)
        const dateMatch = transferDate
            ? item.transferDate && new Date(item.transferDate).toDateString() === new Date(transferDate).toDateString()
            : true;
    
        // Ensure filtering works correctly
        return (search === "" || debitAccountMatch || creditAccountMatch || creditAccountNameMatch || debitAccountNameMatch) && dateMatch && credit && debit;
    });
    
    
      
      
      
    useEffect(()=>{
      fetchData();
    },[])
    
    const handleCopy = () => {
        const copyData = transfers.map(transfer => 
            `${transfer.transferCode}\t${new Date(transfer.transferDate).toDateString()}\t${transfer.referenceNo}\t${transfer.debitAccount?.accountNumber||"NA"}\t${transfer.creditAccount?.accountNumber||"NA"}\t${transfer.amount}\t${transfer.createdBy}`
        ).join('\n');
        navigator.clipboard.writeText(copyData);
        alert('Data copied to clipboard');
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + 
            transfers.map(transfer => 
                `${transfer.transferCode},${new Date(transfer.transferDate).toDateString()},${transfer.referenceNo},${transfer.debitAccount?.accountNumber||"NA"},${transfer.creditAccount?.accountNumber||"NA"},${transfer.amount},${transfer.createdBy}`
            ).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transfers.csv");
        document.body.appendChild(link);
        link.click();
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Money Transfer List", 14, 16);

        // Preparing the data for the table
        const data = transfers.map(transfer => [
            transfer.transferCode,
            new Date(transfer.transferDate).toDateString(),
            transfer.referenceNo,
            transfer.debitAccount,
            transfer.creditAccount,
            transfer.amount,
            transfer.creatorName,
        ]);

        autoTable(doc, {
            head: [['Transfer Code', 'Transfer Date', 'Reference No.', 'Debit Account', 'Credit Account', 'Amount', 'Created By']],
            body: data,
        });

        doc.save("transfers.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExcelDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(transfers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transfers");
        XLSX.writeFile(workbook, "transfers.xlsx");
    };

    const handleToggleColumns = () => {
        alert("Column toggling functionality is not implemented.");
    };

   
    const indexOfLastItem = currentPage * entriesPerPage;
const indexOfFirstItem = indexOfLastItem - entriesPerPage;
const totalPages = Math.ceil(filteredData.length / entriesPerPage);
const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    const handleEntriesChange=(e)=>{
      setEntriesPerPage(Number(e.target.value))
      setCurrentPage(1)
    }
    const handlePageChange = (newPage) =>  {
      if(newPage >=1 && newPage <=totalPages )
      setCurrentPage(newPage);
    }

    const handleDelete = async (id) => {
      const conf= window.confirm("Do u want to delete this ?")
      if(!conf){
        return ;
      }
      setLoading(true)
     
      try {
        const response = await axios.delete(`api/money-transfers/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      
       alert("Deleted Successfully")
      
      } catch (error) {
        console.error( error.message);
      }
      finally{
        fetchData();
        setLoading(false)
      }
    };
    
if(loading) return(<LoadingScreen/>)
    return (
        <div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                
              {/* Sidebar component with open state */}
              <div className="w-auto">
                
              <Sidebar isSidebarOpen={isSidebarOpen} />
              </div>
                
                 {/* Content */}
               <div className={`overflow-x-auto flex flex-col  md:p-2 min-h-screen w-full p-2`}>
            {/* Header Section */}
            <header className="flex flex-col items-center justify-between px-1 py-2 bg-gray-100 rounded-md shadow sm:flex-row">
                <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                    <h1 className="text-lg font-semibold truncate sm:text-xl">Money Transfer List</h1>
                    <span className="text-xs text-gray-600 sm:text-sm">View/Search Transfers</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                    <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
                    <BiChevronRight className="mx-1 sm:mx-2" />
                    <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Money Transfer List</a>
                </nav>
            </header>

            <div className="flex items-center justify-between p-4 mt-1 mb-4 border-t-4 rounded-lg border-cyan-500">
                <div></div>
                <div>
                    <Link to="/add-money-transfer" className="px-4 py-2 text-white no-underline transition rounded bg-cyan-500 hover:bg-cyan-600"><span className="text-lg">+</span> Create Transfer</Link>
                    <Link to="/account-list" className="bg-green-600 text-white px-4 py-2 rounded">
                <span className="text-lg">+</span> Account List
              </Link>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex-col items-start md:flex-row md:items-center">
                <div className="flex flex-wrap justify-between space-y-2">
                    {/* Transfer Date Filter */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Transfer Date</label>
                        <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="w-48 p-2 border" />
                    </div>
                    {/* Debit Account Filter */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Debit Account</label>
                        <select value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} className="w-48 p-2 border">
                            <option  disabled>Select</option>
                            <option value="all">ALL</option>
                            {
                              transfers.map((item)=>(
                                <option value={item.debitAccount?.accountNumber.toLowerCase()}>{item.debitAccount?.accountNumber}</option>
                              ))
                            }
                        </select>
                    </div>
                    {/* Credit Account Filter */}
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-700">Credit Account</label>
                        <select value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} className="w-48 p-2 border">
                            <option  disabled>Select</option>
                            <option value="all">ALL</option>
                            {
                              transfers.map((item)=>(
                                <option value={item.creditAccount?.accountNumber.toLowerCase()}>{item.creditAccount?.accountNumber}</option>
                              ))
                            }
                        </select>
                    </div>
                    {/* User Filter */}
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
            {/* Money Transfer Table */}
            <div className="overflow-x-auto">
  <table className="w-full mt-4 border border-collapse border-gray-300">
    <thead className="bg-gray-200">
      <tr>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Transfer Code</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Transfer Date</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Reference No.</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Debit Account</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Credit Account</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Amount</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Created by</th>
        <th className="p-2 border border-gray-300 whitespace-nowrap">Action</th>
      </tr>
    </thead>
    <tbody>
      {currentUsers.length === 0 ? (
        <tr>
          <td colSpan="8" className="p-4 text-center">No data available in table</td>
        </tr>
      ) : (
        currentUsers.map((transfer) => (
          <tr key={transfer._id} className="hover:bg-gray-100">
            <td className="p-2 border border-gray-300">{transfer.transferCode}</td>
            <td className="p-2 border border-gray-300">{new Date(transfer.transferDate).toDateString()}</td>
            <td className="p-2 border border-gray-300">{transfer.referenceNo}</td>
            <td className="p-2 border border-gray-300">{transfer.debitAccount?.accountNumber || "N/A"}</td>
            <td className="p-2 border border-gray-300">{transfer.creditAccount?.accountNumber || "N/A"}</td>
            <td className="p-2 border border-gray-300">{transfer.amount}</td>
            <td className="p-2 border border-gray-300">{transfer.creatorName}</td>
            <td className="p-2 border border-gray-300">
            <button
className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
            hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
onClick={() => {
  if (actionMenu) setActionMenu(null);
  else setActionMenu(transfer._id);
}}
>
<span>Action</span>
<svg
  className={`w-4 h-4 transition-transform duration-200 ${
    actionMenu === transfer._id ? "rotate-180" : ""
  }`}
  fill="none"
  stroke="currentColor"
  strokeWidth={2}
  viewBox="0 0 24 24"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
</button>


                      {actionMenu === transfer._id && (
                        <div className="absolute z-50 mt-2 bg-white border shadow-lg t-0 w-28">
                          <button 
                          className="w-full px-1 py-0 text-left text-green-500 hover:bg-gray-100"
                           onClick={()=>navigate(`/add-money-transfer?id=${transfer._id}`)}> 
                            
                            ✏️ Edit
                          </button>
                          <button
                            className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
                            onClick={() => handleDelete(transfer._id)}
                          >
                            🗑️ Delete
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
    );
};

export default MoneyTransferList; 
