import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {   FaTrash, FaTachometerAlt,FaMoneyBillWave ,FaEye} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BiChevronRight } from 'react-icons/bi';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import RiderMoneyTransfer from "./RiderMoneyTransfer.jsx"
import RiderTransactionsList from './RiderTranscationList.jsx';
import RiderOrderList from './RiderOrderView.jsx';
import RiderAddMoney from './RiderAddMoney.jsx';
// import { useNavigate } from 'react-router-dom';
const RiderAccountList = () => {
    const navigate=useNavigate()
    const [accounts, setAccounts] = useState([]);
    const [error, setError] = useState('');
    const [hiddenColumns, setHiddenColumns] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
  const[loading,setLoading]=useState(false)
    const tableRef = useRef();
    const[searchTerm,setSearchTerm]=useState("")
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
   const[riderDeposit,setRiderDepsit]=useState(false)
       const [dropdownIndex, setDropdownIndex] = useState(null);
       const[rider,setRider]=useState([])
       const[riderAccount,setRiderAccount]=useState({})
       const[riderTranscations,setRiderTranscations]=useState([])
       const[riderTranscationsView,setRiderTranscationsView]=useState(false)
       const[riderOrderView,setRiderOrderView]=useState(false)
       const[RiderAddMoneyView,setRiderAddMoneyView]=useState(false)
       const[orders,setOrders]=useState([])
       const[riderInfo,setRiderInfo]=useState([])
        useEffect(()=>{
           if(window.innerWidth < 768){
             setSidebarOpen(false)
           }
         },[])
    const fetchAccounts = async () => {
        try {
            setLoading(true)
          const response = await  axios.get('api/rider/all', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          
          console.log(response.data)
          setAccounts(response.data.data)
        } catch (err) {
          console.log(err.message);
        } 
        finally{
            setLoading(false)
        }
      };
    useEffect(()=>{
      fetchAccounts()
    },[])
  
    const filteredData = accounts.filter(item => 
        item.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item._id.toLowerCase().includes(searchTerm.toLowerCase()) 
      );


   

   

    const handlePrint = () => {
        window.print();
    };

  

    const handleEntriesChange=(e)=>{
      setEntriesPerPage(Number(e.target.value))
      setCurrentPage(1)
    }
    const indexOfLastItem = currentPage * entriesPerPage;
const indexOfFirstItem = indexOfLastItem - entriesPerPage;
const totalPages = Math.ceil(filteredData.length / entriesPerPage);
const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);
const handlePageChange = (newPage) =>  {
  if(newPage >=1 && newPage <=totalPages )
  setCurrentPage(newPage);
}
  
    const handleDelete = async (id) => {
        const conf= window.confirm("Do u want to delete this")
        if(!conf){
          return ;
        }
        setLoading(true)
       
        try {
          const response = await axios.delete(`api/accounts/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
        
         alert("Deleted Successfully")
        
        } catch (error) {
          console.error( error.message);
        }
        finally{
          await fetchAccounts()
          setLoading(false)
        }
      };
   


    // Add this to your component state
const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

// Modify your toggleDropdown function
const toggleDropdown = (id, event) => {
  if (event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({ x: rect.left, y: rect.top });
  }
  setDropdownIndex(dropdownIndex === id ? null : id);
};

// Export to PDF
const exportToPDF = () => {
  const doc = new jsPDF();
  
  // Table title
  doc.setFontSize(18);
  doc.text('Rider Accounts Report', 14, 15);
  
  // Prepare data
  const headers = [
    'Rider Name',
    'Account No.',
    'Total Sale',
    'Cash Sale',
    'Bank Sale',
    'Money Transfer',
    'Opening',
    'Current Balance'
  ];
  
  const data = currentUsers.map(rider => [
    `${rider.firstname} ${rider.lastname}`,
    rider.riderAccount.accountNumber || "NA",
    rider.riderAccount.totalOrderSale,
    rider.riderAccount.cashSale,
    rider.riderAccount.bankSale,
    rider.riderAccount.moneyTransfer,
    rider.riderAccount.openingBalance.toFixed(2),
    rider.riderAccount.currentBalance || 0
  ]);

  // Add table
  autoTable(doc,{
    head: [headers],
    body: data,
    startY: 25,
    styles: {
      cellPadding: 3,
      fontSize: 9,
      valign: 'middle',
      halign: 'center'
    },
    headStyles: {
      fillColor: [229, 231, 235], // bg-gray-200
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // bg-gray-50
    }
  });

  // Save PDF
  doc.save('rider_accounts_report.pdf');
};

// Export to Excel
const exportToExcel = () => {
  // Prepare data
  const data = [
    [
      'Rider Name',
      'Account No.',
      'Total Sale',
      'Cash Sale',
      'Bank Sale',
      'Money Transfer',
      'Opening',
      'Current Balance'
    ],
    ...currentUsers.map(rider => [
      `${rider.firstname} ${rider.lastname}`,
      rider.riderAccount.accountNumber || "NA",
      rider.riderAccount.totalOrderSale,
      rider.riderAccount.cashSale,
      rider.riderAccount.bankSale,
      rider.riderAccount.moneyTransfer,
      rider.riderAccount.openingBalance.toFixed(2),
      rider.riderAccount.currentBalance || 0
    ])
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Style header row
  const headerStyle = {
    fill: { fgColor: { rgb: "E5E7EB" } }, // bg-gray-200
    font: { bold: true }
  };
  for (let col = 0; col < data[0].length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellRef].s) ws[cellRef].s = {};
    Object.assign(ws[cellRef].s, headerStyle);
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Rider Accounts");
  
  // Save Excel file
  XLSX.writeFile(wb, 'rider_accounts.xlsx');
};


const copyToClipboard = () => {
  // Prepare headers
  const headers = [
    'Rider Name',
    'Account Number',
    'Total Order Sale',
    'Cash Sale',
    'Bank Sale',
    'Money Transfer',
    'Opening Balance',
    'Current Balance'
  ];

  // Prepare data rows
  const rows = currentUsers.map(rider => [
    `${rider.firstname} ${rider.lastname}`,
    rider.riderAccount.accountNumber || "NA",
    rider.riderAccount.totalOrderSale,
    rider.riderAccount.cashSale,
    rider.riderAccount.bankSale,
    rider.riderAccount.moneyTransfer,
    rider.riderAccount.openingBalance.toFixed(2),
    rider.riderAccount.currentBalance || 0
  ]);

  // Convert to tab-separated text (good for pasting into spreadsheets)
  let textContent = headers.join('\t') + '\n';
  rows.forEach(row => {
    textContent += row.join('\t') + '\n';
  });

  // Copy to clipboard
  navigator.clipboard.writeText(textContent)
    .then(() => {
      alert('Rider accounts data copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy data to clipboard');
    });
};

const exportToCSV = () => {
  // Prepare headers
  const headers = [
    'Rider Name',
    'Account Number',
    'Total Order Sale',
    'Cash Sale',
    'Bank Sale',
    'Money Transfer',
    'Opening Balance',
    'Current Balance'
  ];

  // Prepare data rows
  const rows = currentUsers.map(rider => [
    `"${rider.firstname} ${rider.lastname}"`, // Wrap in quotes to handle names with commas
    rider.riderAccount.accountNumber || "NA",
    rider.riderAccount.totalOrderSale,
    rider.riderAccount.cashSale,
    rider.riderAccount.bankSale,
    rider.riderAccount.moneyTransfer,
    rider.riderAccount.openingBalance.toFixed(2),
    rider.riderAccount.currentBalance || 0
  ]);

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'rider_accounts.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

    if(loading) return(<LoadingScreen/>)
        
          return (
        <div className="flex flex-col h-screen ">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                <div className="w-auto">
                  
              <Sidebar isSidebarOpen={isSidebarOpen} />
                </div>
              {/* Sidebar component with open state */}
                
                 {/* Content */}
               <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
                {/* Header */}
                <header className="flex flex-col items-center justify-between px-1 py-2 bg-gray-100 rounded-md shadow sm:flex-row">
                <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                    <h1 className="text-lg font-semibold truncate sm:text-xl">Rider Accounts List</h1>
                    <span className="text-xs text-gray-600 sm:text-sm">View/Search Rider Accounts</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
 <Link to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-cyan-600 text-sm/6">
                    <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600"/> Home
                    </Link>                    <BiChevronRight className="mx-1 sm:mx-2" />
   <Link to="/account/rider/view" className="flex items-center text-gray-500 no-underline hover:text-cyan-600 text-sm/6">
                   Rider Accounts List
                    </Link>                </nav>
            </header>
{
      (riderTranscationsView) && (<RiderTransactionsList    setRiderTransactionsView={setRiderTranscationsView} transactions={riderTranscations || []}  riderInfo={riderInfo} />)

}
{
          (riderDeposit) && (<RiderMoneyTransfer         isOpen={riderDeposit} onClose={()=>{setRiderDepsit(false); fetchAccounts()}}  rider={rider || "NA"}  data={riderAccount} />)

}
 {
  (riderOrderView)  && (<RiderOrderList orders={orders} setRiderOrderView={setRiderOrderView} riderInfo={riderInfo} />)
 }     
 {
  (RiderAddMoneyView) && (<RiderAddMoney  isOpen={RiderAddMoneyView} onClose={()=>{setRiderAddMoneyView(false); fetchAccounts()}}  rider={rider || "NA"}  data={riderAccount}/>)
 }     

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
                <button onClick={copyToClipboard} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={exportToExcel} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={exportToPDF} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={exportToCSV} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            { error ? (
                <p className="text-red-500">Error: {error}</p>
            ) : (
<div className="relative w-full overflow-x-auto">
  <table className="min-w-full border border-collapse border-gray-300" ref={tableRef}>
    <thead>
      <tr className="bg-gray-200">
        <th className="p-2 text-sm border border-gray-300">Rider Name</th>
        <th className="p-2 text-sm border border-gray-300">Account Number</th>
        <th className="p-2 text-sm border border-gray-300">Total Order Sale</th>
        <th className="p-2 text-sm border border-gray-300">Cash Sale</th>
        <th className="p-2 text-sm border border-gray-300">Bank Sale</th>
        <th className="p-2 text-sm border border-gray-300">Money Transfer</th>
        <th className="p-2 text-sm border border-gray-300">Opening</th>
        <th className="p-2 text-sm border border-gray-300">Current Balance</th>
        <th className="p-2 text-sm border border-gray-300">Action</th>
      </tr>
    </thead>
    <tbody>
      {currentUsers.length <= 0 && (
        <tr>
          <td colSpan='10' className="py-2 text-lg text-center border border-gray-300">No Data Available</td>
        </tr>
      )}
      {currentUsers.length > 0 && 
        currentUsers.map(rider => (
          <tr key={rider._id} className="hover:bg-gray-100">
            <td className="p-2 text-sm border border-gray-300">{rider.firstname} {rider.lastname}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.accountNumber || "NA"}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.totalOrderSale}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.cashSale}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.bankSale}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.moneyTransfer}</td>
            <td className="p-2 text-sm border border-gray-300">{rider.riderAccount.openingBalance.toFixed(2)}</td>
            <td className="p-2 text-sm border border-gray-300">
              {rider.riderAccount.currentBalance || 0}
            </td>
          <td className="relative p-2 text-sm border border-gray-300">
  <div className="flex justify-center">
    <div className="relative inline-block">
      {/* Action Button */}
      <button
        onClick={(e) => toggleDropdown(rider.riderAccount._id, e)}
        className="flex items-center gap-1.5 px-4 py-2 text-white transition-all duration-200 rounded-lg shadow-sm bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        aria-expanded={dropdownIndex === rider.riderAccount._id}
        aria-haspopup="true"
      >
        Actions
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${dropdownIndex === rider.riderAccount._id ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {dropdownIndex === rider.riderAccount._id && (
        <div 
          className="fixed z-50 w-56 mt-1 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
         
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1" role="none">

                <button 
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100/90 transition-colors duration-150 group"
              role="menuitem"
              onClick={() => {
                console.log(rider.orderId);
                setOrders(rider.orderId);
                setRiderOrderView(true);
                                setRiderInfo(rider)

                setDropdownIndex(null);
              }}
            >
              <FaEye className="w-5 h-5 mr-3 text-cyan-500 group-hover:text-cyan-600" />
              <span>View Order History</span>
            </button>


            <div className="my-1 border-t border-gray-100/80"></div>



            
            <button 
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100/90 transition-colors duration-150 group"
              role="menuitem"
              onClick={() => {
                console.log(rider.RiderTranscation);
                setRiderTranscations(rider.RiderTranscation);
                setRiderTranscationsView(true);
                setRiderInfo(rider)
                setDropdownIndex(null);
              }}
            >
              <FaEye className="w-5 h-5 mr-3 text-cyan-500 group-hover:text-cyan-600" />
              <span>View Transactions</span>
            </button>
            
            <div className="my-1 border-t border-gray-100/80"></div>
            
            <button 
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100/90 transition-colors duration-150 group"
              role="menuitem"
              onClick={() => {
                setRiderDepsit(true);
                setRider(rider);
                setRiderAccount(rider.riderAccount);
                setDropdownIndex(null);
              }}
            >
              <FaMoneyBillWave className="w-5 h-5 mr-3 text-green-500 group-hover:text-green-600" />
              <span>Money Transfer</span>
            </button>
            
            <div className="my-1 border-t border-gray-100/80"></div>

             <button 
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100/90 transition-colors duration-150 group"
              role="menuitem"
              onClick={() => {
                setRiderAddMoneyView(true);
                setRider(rider);
                setRiderAccount(rider.riderAccount);
                setDropdownIndex(null);
              }}
            >
              <FaMoneyBillWave className="w-5 h-5 mr-3 text-green-500 group-hover:text-green-600" />
              <span>Add Money</span>
            </button>
            <div className="my-1 border-t border-gray-100/80"></div>
            
            <button 
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-gray-100/90 transition-colors duration-150 group"
              role="menuitem"
              onClick={() => handleDelete(rider.riderAccount._id)}
            >
              <FaTrash className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-600" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
</td>
          </tr>
        ))
      }
    </tbody>
  </table>
</div>
            )}

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

export default RiderAccountList;
