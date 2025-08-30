import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { useNavigate,NavLink } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import {FaTachometerAlt} from "react-icons/fa";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../Loading';
export default function NewCustomerlist() {
  
  // Configuration options for table display
  const entries_options = [10, 20, 30, 40, 50]; // Options for entries per page dropdown
  const button = ["Copy", "Excel", "PDF", "Print", "CSV", "Columns"]; // Export/action button labels
  const Navigate = useNavigate(); // Navigation hook for routing

  // Sample customer data for demonstration
  const [data,setData]=useState([]);
 const[status,setStatus]=useState([])
  // State management for component
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Current pagination page
  const [entriesPerPage, setEntriesPerPage] = useState(10); // Number of entries per page
  const [search, setSearch] = useState(''); // Search filter input
  const [isSidebarOpen,setSidebarOpen] = useState(true); // Sidebar visibility state
  const [check,setCheckbox] = useState(false); // Checkbox state for bulk actions
 const[total,setTotal]=useState(0)
 const[sales,setSales]=useState(0)
 const[singleCheck,setSingleCheck]=useState([])
const[previousDue,setPreviousDue]=useState(0)
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
 //fetch customer
 const fetchData = async () => {
  setLoading(true)
  try {
    const response = await  axios.get('api/customer/all', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
      }
    }) // Replace with actual API URL
    
    setData(response.data.data); 
    console.log(response.data)
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
 
const filteredData = 
data.filter(item => 
  item.customerName.toLowerCase().includes(search.toLowerCase()) || 
  item._id.toLowerCase().includes(search.toLowerCase())
);

useEffect(()=>{
  fetchData()},[])
  
  
  
  
  
  // Filter data based on search input
 

  // Pagination control handler
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);

  const calculate=()=>{
  
    const totalCredit = currentUsers.reduce((sum, item) => sum + item.creditLimit, 0);
      const totalPreviousDue = currentUsers.reduce((sum, item) => sum + item.previousDue, 0);
     const salesreturn=currentUsers.reduce((sum,item)=>sum+(item.salesReturnDue || 0),0)
      setTotal(totalCredit);
      setPreviousDue(totalPreviousDue);
      setSales(salesreturn)
  }
  
  useEffect(()=>{calculate()},[data,filteredData])
  const handlePageChange = (newPage) =>  {
    if(newPage >=1 && newPage <=totalPages )
    setCurrentPage(newPage);
  }
  const handleEntriesChange=(e)=>{
    setEntriesPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
 
  const handleCopy = () => {
    const data = filteredData.map(item => `${item._id}, ${item.customerName}, ${item.mobile},${item.email},${item.address?item.address.locationLink:"No Location link"},${item.creditLimit},${item.previousDue},${item.salesReturnDue || 0},${item.advance},${status.includes(item._id)? 'InActive' : 'Active'}}`).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 20, 20);
    const tableData = filteredData.map(item => [
      item._id,
      item.customerName,
      item.mobile,
      item.email,
      item.address?item.address.locationLink:"No Location link",
      item.creditLimit,
      item.previousDue,
      item.salesReturnDue || 0,
      item.advance,
      status.includes(item._id)? 'InActive' : 'Active'
    ]);

    autoTable(doc, {
      head: [['Customer Id', 'Customer Name', 'Mobile', 'Email', 'Location Link', 'Credit Limit', 'Previous Due','Sales return due','Advance','Status']],
      body: tableData,
    });

    doc.save("customer_list.pdf");
  };

  const handlePrint = () => {
    window.print();
  };


  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(user => Object.values(user).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete customer")
    if(!conf){
      return ;
    }
    setLoading(true)
   
    try {
      const response = await axios.delete(`api/customer/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{
      setLoading(false)
      fetchData()
    }
  };

  const handleAction=(e,id)=>{
    const value=e.target.value
    if(value==="edit") Navigate(`/customer/add?id=${id}`)
    if(value==="delete") handleDelete(id)
     if(value==="discount") Navigate(`/create?customerid=${id}`) 
  }
  const single=(id)=>{
   setSingleCheck((prev)=>(prev.includes(id)?prev.filter((item) => item!=id):[...prev,id]))
  }
  if(loading) return <LoadingScreen />
  if(error) return <h1>Something Went Wrong...</h1>
  return (
    <div className='flex flex-col overflow-x-hidden'>
      {/* Top navigation bar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className='flex w-screen overflow-x-hidden'>
        {/* Sidebar component */}
          <div>
            
          <Sidebar isSidebarOpen={isSidebarOpen} />
          </div>
        {/* Main content container */}
        {/* <div className='w-full h-screen ml-2 b-gray-300'> */}
        <div className={`  flex flex-col  transition-all duration-300  p-2 w-full overflow-x-hidden `}>
          {/* Page header and breadcrumbs */}
          <div className='flex flex-col items-start justify-between py-2 md:items-end md:flex-row '>
            <div className='flex items-end gap-2 pl-2 '> 
              <span className='text-3xl '>Customers List</span>
              <span className='text-sm text-gray-700'>View /Search Customers</span>               
            </div>  
            <div className='flex gap-2 pl-2 pr-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:bg-transparent'>
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline" ><FaTachometerAlt />Home </NavLink>
              <span>&gt;</span>
              <NavLink to="/customer/import" className="text-gray-700 no-underline">Import Customers</NavLink>
              <span>&gt;</span>
              <NavLink to="/customer/view" className="text-gray-700 no-underline ">Customers</NavLink>                   
            </div>
          </div>

          {/* Main table container */}
          <div className='w-full mx-auto bg-white border-t-4 border-collapse rounded-lg shadow-md border-opacity-55 border-t-blue-600'>
            {/* Table header with bulk action controls */}
            <div className='flex flex-col items-center justify-start px-3 py-2 sm:justify-between sm:flex-row'>
              <div className='flex items-center'>
                <Input type="checkbox" />
                View Account Receivable Customers
              </div>
              {/* Create new customer button */}
              <button className='flex-shrink-0 px-4 py-2 font-bold text-center text-white bg-blue-600 rounded cursor-pointer hover:bg-blue-700' onClick={()=>Navigate("/customer/new")}>
                <span className='text-xl'>+</span>Create Customer
              </button>
            </div>

            {/* Table controls and content */}
            <div className=''>
              {/* Entries selector and table controls */}
              <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={handleEntriesChange}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2 px-2'>
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm md:w-auto" onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

              {/* Main table content */}
              <div className='w-full overflow-x-auto'>
                <table className='w-full border-separate'>
                  {/* Table column headers */}
                  <thead className='text-sm'>
                    <tr className="bg-gray-200">
                      <th className="px-4 py-2 text-left">
                        <Input type="checkbox" id="table_head" checked={check} onChange={()=>setCheckbox(!check)} />
                      </th>
                      <th className="px-4 py-2 text-left">CUSTOMER ID</th>
                      <th className="px-4 py-2 text-left">CUSTOMER Name</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      {/* Responsive hidden columns */}
                      <th className="px-4 py-2 text-left ">Location</th>
                      <th className="px-4 py-2 text-left ">Type</th>
                      {/* <th className="hidden px-4 py-2 text-left lg:table-cell">Advance</th> */}
                      <th className="px-4 py-2 text-left ">Status</th>
                      <th className="px-4 py-2 text-left ">Action</th>
                    </tr>
                  </thead>

                  {/* Table body with customer data */}
                  <tbody className='border-gray-100 border-1'>
                    {filteredData.length <=0 &&(
                      <tr>
                         <td className='px-4 py-2 text-center border-gray-100 border-1' colSpan='15'>No Data Available</td>
                      </tr>
                    )}
                    {filteredData.slice((currentPage - 1)* entriesPerPage, currentPage * entriesPerPage).map((item, index) => (
                      <tr key={index}>
                        <td className='px-4 py-2 border-gray-100 border-1'>
                          <Input type="checkbox"  id="table_body" checked={check || singleCheck.includes(item._id)} onChange={()=>single(item._id)}/>
                        </td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item._id}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.customerName}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.mobile}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.email}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.locationLink}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.type}</td>
                        {/* Responsive hidden columns */}

                        {/* <td className='hidden px-4 py-2 border-gray-100 border-1 lg:table-cell'>{item.advance}</td> */}
                        <td className='px-4 py-2 border-gray-100 border-1'  onClick={() =>
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
                        <td className='py-2 border-gray-100 border-1'>
                          <select className='py-1 text-sm border rounded-sm ' onClick={(e)=>handleAction(e,item._id)}>
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
    ${(currentPage === totalPages || totalPages===0) 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages || totalPages===0}
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



