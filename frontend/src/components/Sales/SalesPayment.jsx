import React, {useEffect, useState} from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import Select from 'react-select'
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import LoadingScreen from '../../Loading.jsx';
import { useNavigate } from 'react-router-dom';
const PurchaseOverview = () => {
  const navigate=useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const[currentPage,setCurrentPage]=useState(1)
const[paymentType,setPaymentType]=useState([])
const[salesPayment,setSalesPayment]=useState([])
const[searchtype,setSearchType]=useState("")
const[total,setTotal]=useState(0)
const[loading,setLoading]=useState(false)
const[actionMenu,setActionMenu]=useState(null)
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const fetchSales = async ()=>{
    const token=localStorage.getItem("token")
    if(!token){
      console.log ("No token found redirecting...")
    
      return ;
    }
    setLoading(true)
    try {
      const response = await axios.get("api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Sales List")
      
     console.log(response.data);
     console.log("📑 payments payload:", response.data);

     setSalesPayment(response.data)
    } catch (error) {
      alert(error.message)
    }
    finally{
      setLoading(false)
    }
  }

  const fetchPaymentType = async ()=>{
    const token=localStorage.getItem("token")
    if(!token){
      console.log ("No token found redirecting...")
    
      return ;
    }
    setLoading(true)
    try {
      const response = await axios.get("api/payment-types", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Payment Type List")
      
     console.log(response.data);
     const newPaymentType = [
      { label: "All", value: "all" },
      ...response.data.data
        .filter(item => item.status === "active")
        .map(item => ({
          label: item.paymentTypeName,
          value: item.paymentTypeName
        }))
    ];
    
     setPaymentType(newPaymentType)
    } catch (error) {
      alert(error.message)
    }
    finally{
      setLoading(false)
    }
  }

  const filteredData = salesPayment.filter(item =>{
    
    const paymenttype=searchtype === "all" || searchtype === "" || item.paymentType === searchtype
    const search=item.customer?.toLowerCase()?.includes(searchTerm?.toLowerCase()) 
     return paymenttype && search
  }
  );
  
 const handleDelete = async (paymentId) => {
  if (!window.confirm("Are you sure you want to delete this payment?")) return;

  const token = localStorage.getItem("token");
  if (!token) return alert("No token, please login again.");

  setLoading(true);
  try {
    await axios.delete(`/api/sales/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchSales();                 // refresh the table
    alert("Payment deleted");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};



const calculate = () => {
    const totalAmount = filteredData.reduce((sum, item) => sum + item.paymentAmount, 0);
  setTotal(totalAmount);
};

  useEffect(()=>{
    calculate()
  },[filteredData])

  
  

  
  useEffect(()=>{
    fetchSales();
    fetchPaymentType()
  },[])



    const handleCopy = () => {
        const data = filteredData.map(sale => `${sale.paymentCode}, ${new Date(sale.paymentDate).toDateString()},${sale.saleCode},${sale.customer},${sale.paymentAmount},${sale.paymentType},${sale.paymentNote},${sale.creatorName || "N/A"} `).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
    };

    const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "salepayment");
        XLSX.writeFile(wb, "salepayment.xlsx");
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Roles List", 20, 20);
        const tableData = filteredData.map(sale => [sale.paymentCode,new Date(sale.paymentDate).toDateString(),sale.saleCode,sale.customer,sale.paymentAmount,sale.paymentType,sale.paymentNote,sale.creatorName || "N/A"]);
        autoTable(doc, {
            head: [[  'Payment Code', 'Payment Date', 'Sales Code', 'Customer Name',
                'Payment', 'Payment Type', 'Payment Note', 'Created by']],
            body: tableData,
        });
        doc.save('salePayment.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "salepayment.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const indexOfLastItem = currentPage * entriesPerPage;
    const indexOfFirstItem = indexOfLastItem - entriesPerPage;
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage*entriesPerPage);

    const handlePageChange = (newPage) =>  {
      if(newPage >=1 && newPage <=totalPages )
      setCurrentPage(newPage);
    }
    const handleEntriesChange=(e)=>{
      setEntriesPerPage(Number(e.target.value))
      setCurrentPage(1)
    }





  if(loading) return (<LoadingScreen />)
  return (
<div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="box-border flex min-h-screen ">
                {/* Sidebar */}
                <div className='w-auto'>
              {/* Sidebar component with open state */}
              <Sidebar isSidebarOpen={isSidebarOpen} />
                </div>
                 {/* Content */}
         <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
      {/* ----------------header----------------------------------- */}
<header className="flex flex-col items-center justify-start px-2 py-2 mb-2 bg-gray-100 rounded-md shadow md:justify-between md:flex-row">
            
            <div className="flex items-baseline gap-2 sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Sales Payment List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Sales Payment</span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="text-gray-500 hover:text-cyan-600" /> Home
              </NavLink>
              {/* <BiChevronRight className="hidden sm:mx-2 sm:inline" /> */}
              <NavLink to="/sales-payment" className="text-gray-700 no-underline hover:text-cyan-600">
               &gt; Sales Payment List
              </NavLink>
            </nav>
</header>
    
{/* ------------------------------------------------------------------ */}
<div className="flex flex-col flex-wrap gap-2 p-4 bg-white border rounded-md shadow-md md:flex-row">
      {/* Fourth Div (Payment Type) */}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700">Payment Type</label>
        <Select options={paymentType} className='w-64' onChange={(selectedoption)=>setSearchType(selectedoption.value)}/>
      </div>
{/* Fifth Div (Payment Status) */}
      {/*<div className="flex flex-col flex-1">
        <label className="text-sm font-semibold text-gray-700">Payment Status</label>
        <select className="w-64 p-2 border rounded-md">
          <option>-Select-</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
      </div>*/}
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
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2'>
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

{/* ------------------------------------------------------------------- */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-sm">
          <thead className="bg-gray-200">
            <tr>
              {[
                'Payment Code', 'Sales Code', 'Customer Name',
                'Payment', 'Payment Type', 'Payment Note', 'Created by'
              ].map((header) => (
                <th key={header} className="px-4 py-2 text-sm font-bold text-left border">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {(currentUsers.length<=0)? (<tr><td colSpan="10" className="p-4 text-center text-gray-500 border">No data available in table</td></tr>):
            (currentUsers.map((sale)=>(
               <tr className="bg-gray-100 " key={sale.saleId}>
              <td  className="text-center border">{sale.paymentCode}</td>
              {/*<td  className="text-center border">{new Date(sale.paymentDate).toDateString()}</td>*/}
              <td  className="text-center border">{sale.saleCode}</td>
              <td  className="text-center border">{sale.customer}</td>
              <td  className="text-center border">{sale.paymentAmount}</td>
              <td  className="text-center border">{sale.paymentType}</td>
              <td  className="text-center border">{sale.paymentNote}</td>
              <td  className="text-center border">{sale.creatorName || "N/A"}</td>
              <td className="relative p-2 border">
{/*<button
className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
            hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
onClick={() => {
  if (actionMenu) setActionMenu(null);
  else setActionMenu(sale.saleId);
}}
>
<span>Action</span>
<svg
  className={`w-4 h-4 transition-transform duration-200 ${
    actionMenu === sale.saleId ? "rotate-180" : ""
  }`}
  fill="none"
  stroke="currentColor"
  strokeWidth={2}
  viewBox="0 0 24 24"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
</button>*/}
                      {actionMenu === sale.saleId && (
                        <div className="absolute right-0 z-40 mt-2 bg-white border shadow-lg w-28">
                         
                          <button
                            className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
                            onClick={() => handleDelete(sale.paymentId)}

                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>                
            </tr>  
            )))}
            {/* Total Row */}
            {currentUsers.length>0 &&(
               <tr className="font-bold bg-gray-100">
               <td colSpan="3" className="text-right border">Total :</td>
               <td className="text-center border">{total}</td>
               <td className="text-center border"></td>
               <td className="text-center border"></td>
               <td className="text-center border"></td>
               {/* <td className="text-center border"></td> */}
             </tr>            
            )}
           
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

export default PurchaseOverview;
