import React,{useState,useEffect} from 'react'
import axios from 'axios'
import Button from './Button'
import Input from './Input'
import { useNavigate } from 'react-router-dom'
import Navbar from '../Navbar'
import Sidebar from '../Sidebar'
import { NavLink } from 'react-router-dom'
import {FaTachometerAlt} from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../Loading'
export default function Supplierlist() {
    // Configuration options for table display
    const entries_options = [10, 20, 30, 40, 50] // Entries per page options
    
    // State management for UI components
    const [Users, setUsers] = useState([]);
      const [loading, setLoading] = useState(true); // Loading state
      const [error, setError] = useState(null);
    const[isSidebarOpen,setSidebarOpen]=useState(true) // Sidebar visibility state
    const[check,setCheckbox]=useState(false) // Checkbox state for bulk actions
    const[previousBalance,setPreviousBalance]=useState(0)
    const[purchaseDue,setpurchaseDue]=useState(0)
    const[previousReturnDue,setPreviousReturnDue]=useState(0)
    const[status,setStatus]=useState([])
    const[singleCheck,setSingleCheck]=useState([])
    // Table control buttons
    const button = ["Copy", "Excel", "PDF", "Print", "CSV", "Columns"] // Export/action buttons
    const Navigate=useNavigate(); // Navigation hook
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
   
    const fetchData = async () => {
        try {
          const response = await  axios.get('api/suppliers', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          
          setUsers(response.data.data); // Assuming API returns an array of customers
          console.log(response.data)
         
  
  
  
          
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };


    
  useEffect(() => {
    fetchData();
  }, []);



  

    // Pagination and filtering states
    const[currentPage,setCurrentPage]=useState(1) // Current page number
    const[entriesPerPage,setEntriesPerPage]=useState(10) // Items per page
    const[search,setSearch]=useState('') // Search filter input

    // Filter data based on search query
    const filteredData = Users.filter(item => 
        item.supplierName?.toLowerCase().includes(search.toLowerCase()) || 
        item._id.toLowerCase().includes(search.toLowerCase())
    );

   
    // Pagination control handler
    const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);
  const calculate =()=>{
    const totals = currentUsers.reduce((acc, item) => {
        acc.previousBalance += item.previousBalance || 0;
        acc.purchaseDue += item.purchaseDue || 0;
        acc.previousReturnDue += item.purchaseReturnDue || 0;
        return acc;
    }, { previousBalance: 0, purchaseDue: 0, previousReturnDue: 0 });

    setPreviousBalance(totals.previousBalance);
    setpurchaseDue(totals.purchaseDue);
    setPreviousReturnDue(totals.previousReturnDue);
}
useEffect(()=>{calculate()},[filteredData])
  const handlePageChange = (newPage) =>  {
    if(newPage >=1 && newPage <=totalPages )
    setCurrentPage(newPage);
  }
  const handleEntriesChange=(e)=>{
    setEntriesPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
 const handleCopy = () => {
    const data = filteredData.map(item => `${item._id}, ${item.supplierName}, ${item.mobile},${item.email},${item.previousBalance},${item.purchaseDue},${item.purchaseReturnDue},${item.previousBalance+item.purchaseDue+item.purchaseReturnDue},${status.includes(item._id)? 'InActive' : 'Active'}}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "supplier");
    XLSX.writeFile(wb, "supplier.xlsx");
  };

 const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 20, 20);
    const tableData = filteredData.map(item => [
      item._id,
      item.supplierName,
      item.mobile,
      item.email,
      item.previousBalance,
      item.purchaseDue,
      item.previousReturnDue,
      item.previousBalance+item.purchaseDue+item.purchaseReturnDue,
      status.includes(item._id)? 'InActive' : 'Active'
    ]);

    autoTable(doc, {
      head: [['Supplier Id', 'Supplier Name', 'Mobile', 'Email', 'Previous Balance', 'Purchase Due', 'Previous Return Due','Total','Advance','Status']],
      body: tableData,
    });

    doc.save("supplier_list.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(user => Object.values(user).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "supplier.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
 
  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete supplier")
    if(!conf){
      return ;
    }
    setLoading(true)
    
    try {
      const response = await axios.delete(`api/suppliers/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{
      fetchData()
      setLoading(false)
    }
  };


  const handleAction=(e,id)=>{
    const value=e.target.value
    if(value==="edit") Navigate(`/supplier/add?id=${id}`)
    if(value==="delete") handleDelete(id)
     if(value==="discount") Navigate(`/create?id=${id}`) 
  }
  const single=(id)=>{
    setSingleCheck((prev)=>(prev.includes(id)?prev.filter((item) => item!=id):[...prev,id]))
   }
    if(loading) return <LoadingScreen />
    if(error) return <h1>Something Went Wrong...</h1>

    return (    
<div className="flex flex-col overflow-x-hidden">
{/* Navbar */}
<Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

{/* Main Content */}
<div className="flex w-screen ">
  {/* Sidebar */}
  <div>
    
  <Sidebar isSidebarOpen={isSidebarOpen} />
  </div>
  

  {/* Content */}
  <div className='flex flex-col flex-grow w-full min-h-screen p-2 overflow-x-hidden transition-all duration-300 bg-gray-200'>
                    {/* Page header and breadcrumbs */}
                    <div className='flex flex-col items-end justify-between md:flex-row'>
                        <div className='flex items-end w-full gap-2 pl-2 md:w-1/2'> 
                            <span className='text-3xl '>Supplier List</span>
                            <span className='text-sm text-gray-700'>View /Search Suppliers</span>               
                        </div>  
                        <div className='flex w-full gap-2 pl-2 pr-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
                            <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
                            <span>&gt;</span>
                            <NavLink to="/supplier/import" className="text-gray-700 no-underline">Import Suppliers</NavLink>
                            <span>&gt;</span>
                            <NavLink to="/supplier/view" className="text-gray-700 no-underline ">Suppliers</NavLink>                   
                        </div>
                    </div>  

                    {/* Main table container */}
                    <div className='bg-white border-t-4 max-autorounded-lg border-t-blue-600 border-opacity-55'>
                        {/* Table header with controls */}
                        <div className='flex flex-col items-center justify-start w-full px-3 py-2 sm:justify-between sm:flex-row'>    
                            {/* Bulk action controls */}
                            <div className='flex items-center'>  
                                <Input type="checkbox" />
                                View Account Payable Suppliers
                            </div>

                            {/* Create new supplier button */}
                            <div>
                                <Button 
                                    text="+Create Supplier" 
                                    className='flex-shrink-0 px-4 py-2 font-bold text-center text-white bg-blue-600 rounded cursor-pointer hover:bg-blue-700 '  
                                    onClick={()=> Navigate("/supplier/add")}
                                />
                            </div>
                        </div>

                        {/* Table controls section */}
                        <div className='px-3 border-gray-100 border-t-1 border-1 min-h-50'>  
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
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 md:w-auto" onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

                            {/* Main table content */}
                            <div className='overflow-x-auto'>
                                <table className='w-full border-separate'>
                                    {/* Table column headers */}
                                    <thead className='text-sm'>
                                        <tr className="bg-gray-200">
                                            <th className="px-4 py-2 text-left">
                                                <Input type="checkbox" id="table_head" onChange={()=>setCheckbox(!check)} />
                                            </th>
                                            <th className="px-4 py-2 text-left">Supplier ID</th>
                                            <th className="px-4 py-2 text-left">Supplier Name</th>
                                            <th className="px-4 py-2">Mobile</th>
                                            <th className="px-4 py-2 text-left">Email</th>
                                            {/* Responsive hidden columns */}
                                            <th className="px-4 py-2 text-left ">Previous Balance</th>
                                            <th className="px-4 py-2 text-left">Purchase Due</th>
                                            <th className="px-4 py-2 text-left ">Purchase Return Due</th>
                                            <th className="px-4 py-2 text-left ">Total(+)</th>
                                            <th className="px-4 py-2 text-left ">Status</th>
                                            <th className="px-4 py-2 text-left ">Action</th>
                                        </tr>
                                    </thead>

                                    {/* Table body with supplier data */}
                                    <tbody className='border-gray-100 border-1'>
                                        {currentUsers.length<=0 && (
                                            <tr>
                                                  <td className='py-2 text-center border-gray-100 border-1' colSpan='11'>No Data Available</td>

                                            </tr>
                                        )}
                                        {Array.isArray(currentUsers)&& currentUsers.map((item, index) => (
                                            <tr key={index} id={item._id}>
                                                <td className='px-4 py-2 border-gray-100 border-1'>
                                                    <Input type="checkbox"  id="table_body" checked={check || singleCheck.includes(item._id)} onChange={()=>single(item._id)}/>
                                                </td>
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item._id}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item.supplierName}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item.mobile}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item.email}</td>
                                                {/* Financial data columns */}
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item.previousBalance}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1 '>{item.purchaseDue}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1'>{item.purchaseReturnDue}</td>
                                                <td className='px-4 py-2 border-gray-100 border-1 '>{item.previousBalance+item.purchaseDue+item.purchaseReturnDue}</td>
                                                {/* Status indicator */}
                                                <td className='px-4 py-2 border-gray-100 border-1' onClick={() =>
                                                     setStatus((prev) =>
                                                    prev.includes(item._id)
                                                    ? prev.filter((id) => id !== item._id) // Remove if already present
                                                 : [...prev, item._id] // Add if not present
                                                   )
                                                      }>
                                               {status.includes(item._id) ? (
                                                                <span className="p-1 text-white bg-red-700 rounded-md">Inactive</span>
                                                                  ) : (
                                                        <span className="p-1 text-white bg-green-400 rounded-md">Active</span>
                                                        )}
                                                </td>
                                                {/* Action dropdown menu */}
                                                <td className='px-4 py-2 border-gray-100 border-1'>
                                                <select className='px-1 py-1 text-sm border rounded-sm'  onChange={(e) => handleAction(e,item._id)}>
                                                            <option value="" selected={true} disabled={true}>Actions</option>
                                                            <option value="discount"> Generate Discount Coupon</option>
                                                            <option value="edit">Edit</option>
                                                            <option value="view">View Payment</option>
                                                            <option value="delete">Delete</option>
                                                 </select>
                                                </td>
                                            </tr>
                                          ))}
                                        {/* Table footer with totals */}
                                        {currentUsers.length>0 &&(
                                              <tr>
                                              <td className='px-4 py-2 bg-gray-200'></td>
                                              <td className='px-4 py-2 bg-gray-200'></td>
                                              <td className='px-4 py-2 bg-gray-200'></td>
                                              <td className='px-4 py-2 bg-gray-200'></td>
                                              <td className='px-4 py-2 font-semibold text-right bg-gray-200 '>Total:</td>
                                              <td className='px-4 py-2 font-semibold text-left bg-gray-200 '>{previousBalance}</td>
                                              <td className='px-4 py-2 font-semibold bg-gray-200 '>{purchaseDue}</td>
                                              <td className='px-4 py-2 font-semibold bg-gray-200 '>{previousReturnDue}</td>
                                              <td className='px-4 py-2 font-semibold bg-gray-200 '>{previousBalance+purchaseDue+previousReturnDue}</td>
                                              <td className='px-4 py-2 bg-gray-200 '></td>
                                              <td className='px-4 py-2 bg-gray-200 '></td>
                                          </tr>
                                        ) }
                                      
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
</div>
    );
}



