
import { useState,useEffect } from "react";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import MetricCard from "./MetricCard";
import Card from "./Card";
import axios from "axios";
import { FaCube,FaRegCalendarAlt ,FaMinusSquare,FaFileAlt,FaUsers,FaTruck,FaBriefcase,FaShoppingCart} from 'react-icons/fa';
import BarChartComponent from "./BarChart";
import TrendingItemsDonut from "./PieChart";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from "../../Loading";
const AuditDashboard = () => {
   const[data,setData]=useState([])
   const[items,setItems]=useState([])
   const[lowStock,setLowStock]=useState([])
   const[sale,setSale]=useState([])
   const[searchTerm,setSearchTerm]=useState("")
   const[entriesPerPage,setEntriesPerPage]=useState(10)
   const[currentPage,setCurrentPage]=useState(1)
   const [isSidebarOpen, setSidebarOpen] = useState(true);
   const[active,setActive]=useState("daily")
   useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])
  const fetchDashboardSummary = async () => {
    try {
      const response = await axios.get(
        'api/dashboard-summary',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      setData(response.data.data); 
    } catch (err) {
      console.log(err.message);
    } 
  };
  const fetchRecentlyAdded = async () => {
    try {
      const response = await axios.get(
        'api/items/summary',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      setItems(response.data.data); 
    } catch (err) {
      console.log(err.message);
    } 
  };
  const fetchStockAlert = async () => {
    try {
      const response = await axios.get(
        'api/items/low-stock?threshold=10',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      // Replace with actual API URL
      
      // console.log(response.data)
      setLowStock(response.data.data); 
    } catch (err) {
      console.log(err.message);
    } 
  };
  const fetchSaleInvoice = async () => {
    try {
      const response = await axios.get(
        'api/sales/recent?limit=10',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
      setSale(response.data.data)
    } catch (err) {
      console.log(err.message);
    } 
  };
 
  
   useEffect(()=>
    {
      fetchDashboardSummary();
      fetchRecentlyAdded();
      fetchStockAlert();
      fetchSaleInvoice();
    },[])
   
// Filter the data based on search term
const filteredData = lowStock.filter(item => {
  const searchTermLower = searchTerm.toLowerCase();
  return item.itemName?.toLowerCase().includes(searchTermLower);
});

// Pagination calculations
const indexOfLastItem = currentPage * entriesPerPage;
const indexOfFirstItem = indexOfLastItem - entriesPerPage;
const totalPages = Math.ceil(filteredData.length / entriesPerPage);

// Get current page's items
const currentUsers = filteredData.slice(indexOfFirstItem, indexOfLastItem);

// Handle page change
const handlePageChange = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage);
  }
};

// Handle change in entries per page dropdown/input
const handleEntriesChange = (e) => {
  setEntriesPerPage(Number(e.target.value));
  setCurrentPage(1); // Reset to first page when entries per page changes
};


    const handleCopy = () => {
        const data = currentPage.map(item => `${item.itemName}, ${item.category?.name}, ${item.brand?.brnadName}`).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
    };

    const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(lowStock);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LowStock");
        XLSX.writeFile(wb, "low_stock.xlsx");
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Low Stock List", 20, 20);
        const tableData = lowStock.map((item,index) => [index+1,item.itemName, item.category?.name, item.brand?.brandName]);
        autoTable(doc, {
            head: [['#','Item Name','Category Name','Brand Name']],
            body: tableData,
        });
        doc.save('lowStock.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + lowStock.map(item => Object.values(item).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "low_stock.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="flex flex-col ">
    {/* Navbar */}
    <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Main Content */}
        <div className="box-border flex min-h-screen bg-gray-400">
          {/* Sidebar */}
          
        {/* Sidebar component with open state */}
          <div className="w-auto">
        <Sidebar isSidebarOpen={isSidebarOpen} />
            
          </div>
          
          

       
    <div className="flex flex-col w-full px-2 py-2 mx-auto overflow-x-auto bg-gray-200">


         {/* //Heading */}
         <header className="text-2xl font-semibold text-gray-700">DashBoard</header>
          
          
          
          {/* Set Day Buttons */}
         <div className="flex justify-end w-full mt-2">
         <button className={`px-2 py-2 border rounded-l-md ${active==="daily"?"bg-cyan-500 text-white":"bg-blue-400"}`} onClick={()=>setActive('daily')} >Today</button>
  <button className={`px-2 py-2 border  ${active==="weekly"?"bg-cyan-500 text-white":"bg-blue-400"}`} onClick={()=>setActive("weekly")} onCLick={()=>setActive("weekly")}>Weekly</button> 
  <button className={`px-2 py-2 border  ${active==="monthly"?"bg-cyan-500 text-white":"bg-blue-400"}`} onClick={()=>setActive("monthly")}onCLick={()=>setActive("monthly")}>Monthly</button> 
  <button className={`px-2 py-2 border  ${active==="yearly"?"bg-cyan-500 text-white":"bg-blue-400"}`} onClick={()=>setActive("yearly")}onCLick={()=>setActive("yearly")}>Yearly</button> 
  <button className={`px-3 py-2 border rounded-r-md ${active==="all"?"bg-cyan-500 text-white":"bg-blue-400"}`} onClick={()=>setActive("all")}onCLick={()=>setActive("yearly")}>All</button> 
        </div>

        
{/* //Metric Show       */} 
<div className="grid w-full grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <MetricCard
    title="Purchase Due"
    // value={data.purchaseDue}
    value={data?.purchaseDue || '0'}
    icon={FaCube}
    className="flex items-center justify-between w-full p-4 text-white shadow-md rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 h-28"
  />
  <MetricCard
    title="Sales Due"
    value={data?.salesDue || '0'}
    icon={FaRegCalendarAlt}
    className="flex items-center justify-between w-full p-4 text-white shadow-md rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 h-28"
  />
  <MetricCard
    title="Sales"
    value={data?.totalSales || '0'}
    icon={FaFileAlt}
    className="flex items-center justify-between w-full p-4 text-white shadow-md rounded-xl bg-gradient-to-r from-green-500 to-cyan-400 h-28"
  />
  <MetricCard
    title="Expense"
    value={data?.totalExpense || '0'}
    icon={FaMinusSquare}
    className="flex items-center justify-between w-full p-4 text-white shadow-md rounded-xl bg-gradient-to-r from-blue-900 to-sky-500 h-28"
  />
</div> 

{/* Card */}
<div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <Card title="Customers" value={data?.customerCount || '0'} icon={FaUsers} />
  <Card title="Suppliers" value={data?.supplierCount || '0'} icon={FaTruck} />
  <Card title="Purchases" value={data?.purchaseCount || '0'} icon={FaBriefcase} />
  <Card title="Invoices" value={data?.invoiceCount || '0'} icon={FaShoppingCart} />
</div>
{/* For chart and trending items */}
<div className="flex flex-col w-full gap-4 p-2 mt-4 md:flex-row">
  <BarChartComponent active={active}/>
  <div className="w-full h-auto bg-white border-t-4 border-blue-700 rounded-md md:w-1/2 md:m-0">
    <h5 className="p-2 text-center border-b-2 border-gray-300">RECENTLY ADDED ITEMS</h5>
    <div className="h-50">
    <table className="w-full border-collapse table-auto h-50">
  <thead>
    <tr className="border-b-2 border-gray-300">
      <th className="px-2 py-1 text-left">Sl.No</th>
      <th className="px-2 text-left">Item Name</th>
      <th className="px-2 text-left">Item Sales Price</th>
    </tr>
  </thead>
  <tbody>
  {items?.slice(-12).map((item, index) => (
  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
    <td className="px-4 py-2">{index + 1}</td>
    <td className="px-4 py-2">{item.itemName}</td>
    <td className="px-4 py-2">{item.salesPrice}</td>
  </tr>
))}

   
  </tbody>
</table>
</div>
  </div>
</div>

{/* Stock alert */}
<div className="flex flex-col w-full py-4 mt-3 bg-white border-t-4 border-blue-600 rounded-md">
  <h5 className="px-2 py-2">STOCK ALERT</h5>
  <div className="flex flex-col items-start justify-between w-full gap-2 px-2 md:items-center md:flex-row md:gap-0">
    <div>
      <span>show</span>
      <select className="px-2 py-1 ml-1 border" value={entriesPerPage} onChange={handleEntriesChange}>
        <option value="10">10</option>
        <option value="10">20</option>
        <option value="10">50</option>
      </select>
      <span>entries</span>
    </div>
    <div className="flex flex-col items-start gap-2 md:items-center md:flex-row">
    <div className='flex items-center w-full gap-2'>
    <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
    </div>
    <label  htmlFor="">Search <input type="text" className="px-2 py-1 border " value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}/></label>
    </div>
   
  </div>
  <div className="w-full mt-4 overflow-x-auto">
  <table className="min-w-full border border-gray-200">
  <thead>
    <tr className="text-sm font-semibold text-gray-700 bg-gray-50">
      <th className="w-12 px-4 py-2 text-left border">#</th>
      <th className="px-4 py-2 text-left border">Item Name</th>
      <th className="px-4 py-2 text-left border">Category Name</th>
      <th className="px-4 py-2 text-left border">Brand Name</th>
    </tr>
  </thead>
  <tbody className="text-sm text-gray-600">
    {currentUsers.length>0?currentUsers.map((item,index)=>(
       <tr>
       <td className="px-4 py-2 border">{index+1}</td>
       <td className="px-4 py-2 border">{item.itemName}</td>
       <td className="px-4 py-2 border">{item.category?.name}</td>
       <td className="px-4 py-2 border">{item.brand?.brandName || "NA"}</td>
     </tr>
    )):
    <tr>
      <td className="px-2 py-2 font-semibold text-center" colSpan='4'>
        No Data Available
      </td>
    </tr>
    }
  </tbody>
</table>

  </div>
  <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, lowStock.length)} of {lowStock.length} entries</span>           
              <div className='flex justify-between w-full md:w-auto md:gap-2'>
              <button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
    ${currentPage === 1 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
      onClick={()=>handlePageChange(currentPage-1)}
  disabled={currentPage === 1}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
  Previous
</button>

<button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
    ${currentPage >= totalPages || totalPages === 0 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
      disabled={currentPage >= totalPages || totalPages === 0 }  
      onClick={()=>handlePageChange(currentPage+1)}
>
  Next
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</button>

              </div>
            </div>
  
  </div> 
  
  {/* Trending and Sales invoice */}
{/* <div className="flex flex-col w-full gap-4 mt-4 mb-2 md:flex-row">
  <div className="w-full bg-white border-t-4 border-blue-700 rounded-md">
    <TrendingItemsDonut />
  </div>
      <div className="flex flex-col ">
        <div className="p-4 bg-white border-t-4 border-blue-700 rounded-t-lg">
          <h2 className="text-xl font-semibold">Recent Sales Invoices</h2>
        </div>
        <div className="overflow-x-auto ">
        <table className="overflow-x-auto bg-white border border-gray-200">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="px-2 py-2 text-sm border-b ">Sl.No</th>
              <th className="px-4 py-2 text-sm border-b">Date</th>
              <th className="px-2 py-2 text-sm border-b">Invoice ID</th>
              <th className="px-2 py-2 text-sm border-b">Customer</th>
              <th className="px-2 py-2 text-sm border-b">Total</th>
              <th className="px-2 py-2 text-sm border-b">Status</th>
              <th className="px-2 py-2 text-sm border-b">Created by</th>
            </tr>
          </thead>
          <tbody>
            {sale.length>0?(
              sale.map((item,index)=>(
                <tr className="text-center">
                <td className="px-4 text-sm border-b ">{index+1}</td>
                <td className="py-2 text-sm border-b ">{new Date(item.createdAt).toDateString()}</td>
                <td className="px-2 py-2 text-sm border-b">{item.saleCode}</td>
                <td className="px-2 py-2 text-sm border-b">{item.customer?.email}</td>
                <td className="px-2 py-2 text-sm border-b">{item.grandTotal || '0'}</td>
                <td className="px-2 py-2 text-sm border-b">{item.status}</td>
                <td className="px-2 py-2 text-sm border-b">{item.createdBy?.name}</td>
              </tr>
              ))
            ):(
              <tr className="text-left bg-gray-100">
              <th className="px-2 py-2 text-sm border-b">No Data Available</th>
            </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
  
  </div>        */}
      <div className="flex flex-col w-full gap-4 mt-4 mb-2 overflow-x-auto md:flex-row">
  <div className="w-full pb-2 bg-white border-t-4 border-blue-700 rounded-md">
    <TrendingItemsDonut />
  </div>

  <div className="flex flex-col ">
    <div className="w-full p-4 bg-white border-t-4 border-blue-700 rounded-t-lg">
      <h2 className="text-xl font-semibold">Recent Sales Invoices</h2>
    </div>

    <div className="w-full overflow-x-auto border border-gray-200 rounded-b-md ">
      <table className="min-w-[800px] w-full bg-white">
        <thead>
          <tr className="text-left bg-gray-100">
            <th className="px-2 py-2 text-sm border-b">Sl.No</th>
            <th className="px-4 py-2 text-sm border-b">Date</th>
            <th className="px-2 py-2 text-sm border-b">Invoice ID</th>
            <th className="px-2 py-2 text-sm border-b">Customer</th>
            <th className="px-2 py-2 text-sm border-b">Total</th>
            <th className="px-2 py-2 text-sm border-b">Status</th>
            <th className="px-2 py-2 text-sm border-b">Created by</th>
          </tr>
        </thead>
        <tbody>
          {sale.length > 0 ? (
            sale.map((item, index) => (
              <tr key={item._id} className="text-center">
                <td className="px-4 text-sm border-b">{index + 1}</td>
                <td className="py-2 text-sm border-b">
                  {new Date(item.createdAt).toDateString()}
                </td>
                <td className="px-2 py-2 text-sm border-b">{item.saleCode}</td>
                <td className="px-2 py-2 text-sm border-b">{item.customer?.email}</td>
                <td className="px-2 py-2 text-sm border-b">{item.grandTotal || '0'}</td>
                <td className="px-2 py-2 text-sm border-b">{item.status}</td>
                <td className="px-2 py-2 text-sm border-b">{item.createdBy?.name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-4 text-sm text-center text-gray-500">
                No Data Available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

      </div> 
    
    </div>
    </div>
  );
};


export default AuditDashboard;
