import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { useNavigate, NavLink } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { FaTachometerAlt } from "react-icons/fa";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingScreen from '../../Loading';

export default function CustomerList() {
  const entries_options = [10, 20, 30, 40, 50];
  const button = ["Copy", "Excel", "PDF", "Print", "CSV"];
  const Navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [check, setCheckbox] = useState(false);
  const [singleCheck, setSingleCheck] = useState([]);
  const [total, setTotal] = useState(0);
  const [previousDue, setPreviousDue] = useState(0);
  const [sales, setSales] = useState(0);
  const [status, setStatus] = useState([]);
  const [customerType, setCustomerType] = useState('offline');
  const [offlineData, setOfflineData] = useState([]);
  const [onlineData, setOnlineData] = useState([]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Fetch offline customers
  const fetchOfflineData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('api/customer-data/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
      setOfflineData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch online customers
  const fetchOnlineData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('customer/customers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
      setOnlineData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfflineData();
    fetchOnlineData();
  }, []);

  // Determine which data to display based on customerType
  const data = customerType === 'offline' ? offlineData : onlineData;

  const filteredData = data.filter(item =>
    (item.customerName || item.name)?.toLowerCase().includes(search.toLowerCase()) ||
    item._id.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const calculate = () => {
    if (customerType === 'offline') {
      const totalCredit = currentUsers.reduce((sum, item) => sum + (item.creditLimit || 0), 0);
      const totalPreviousDue = currentUsers.reduce((sum, item) => sum + (item.previousDue || 0), 0);
      const salesreturn = currentUsers.reduce((sum, item) => sum + (item.salesReturnDue || 0), 0);
      setTotal(totalCredit);
      setPreviousDue(totalPreviousDue);
      setSales(salesreturn);
    } else {
      setTotal(0);
      setPreviousDue(0);
      setSales(0);
    }
  };

  useEffect(() => {
    calculate();
  }, [data, filteredData, customerType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages)
      setCurrentPage(newPage);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCopy = () => {
    const dataToCopy = filteredData.map(item => 
      customerType === 'offline' 
        ? `${item._id}, ${item.customerName}, ${item.mobile},${item.email},${item.address?.locationLink || "No Location link"},${item.creditLimit},${item.previousDue},${item.salesReturnDue || 0},${item.advance},${status.includes(item._id) ? 'InActive' : 'Active'}`
        : `${item._id}, ${item.name}, ${item.phone},${item.email},${item.city || "N/A"},0,0,0,0,${status.includes(item._id) ? 'InActive' : 'Active'}`
    ).join('\n');
    navigator.clipboard.writeText(dataToCopy);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const dataToExport = filteredData.map(item => 
      customerType === 'offline' 
        ? {
            ID: item._id,
            Name: item.customerName,
            Mobile: item.mobile,
            Email: item.email,
            Location: item.address?.locationLink || "No Location link",
            CreditLimit: item.creditLimit,
            PreviousDue: item.previousDue,
            SalesReturnDue: item.salesReturnDue || 0,
            Advance: item.advance,
            Status: status.includes(item._id) ? 'InActive' : 'Active'
          }
        : {
            ID: item._id,
            Name: item.name,
            Mobile: item.phone,
            Email: item.email,
            Location: item.city || "N/A",
            CreditLimit: 0,
            PreviousDue: 0,
            SalesReturnDue: 0,
            Advance: 0,
            Status: status.includes(item._id) ? 'InActive' : 'Active'
          }
    );
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 20, 20);
    const tableData = filteredData.map(item => 
      customerType === 'offline' 
        ? [
            item._id,
            item.customerName,
            item.mobile,
            item.email,
            item.address?.locationLink || "No Location link",
            item.creditLimit,
            item.previousDue,
            item.salesReturnDue || 0,
            item.advance,
            status.includes(item._id) ? 'InActive' : 'Active'
          ]
        : [
            item._id,
            item.name,
            item.phone,
            item.email,
            item.city || "N/A",
            0,
            0,
            0,
            0,
            status.includes(item._id) ? 'InActive' : 'Active'
          ]
    );

    autoTable(doc, {
      head: [['Customer Id', 'Customer Name', 'Mobile', 'Email', 'Location', 'Credit Limit', 'Previous Due', 'Sales return due', 'Advance', 'Status']],
      body: tableData,
    });

    doc.save("customer_list.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      filteredData.map(item => 
        customerType === 'offline' 
          ? [item._id, item.customerName, item.mobile, item.email, item.address?.locationLink || "No Location link", item.creditLimit, item.previousDue, item.salesReturnDue || 0, item.advance, status.includes(item._id) ? 'InActive' : 'Active']
          : [item._id, item.name, item.phone, item.email, item.city || "N/A", 0, 0, 0, 0, status.includes(item._id) ? 'InActive' : 'Active']
      ).map(row => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    const conf = window.confirm("Do you want to delete customer?");
    if (!conf) return;
    
    setLoading(true);
    try {
      await axios.delete(`api/customer-data/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Deleted Successfully");
      fetchOfflineData();
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (e, id) => {
    const value = e.target.value;
    if (value === "edit") Navigate(`/customer/add?id=${id}`);
    if (value === "delete") handleDelete(id);
    if (value === "discount") Navigate(`/create?customerid=${id}`);
  };

  const single = (id) => {
    setSingleCheck((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <h1>Something Went Wrong...</h1>;

  return (
    <div className='flex flex-col overflow-x-hidden'>
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className='flex w-screen overflow-x-hidden'>
        <Sidebar isSidebarOpen={isSidebarOpen} />
        
        <div className={`flex flex-col transition-all duration-300 p-2 w-full overflow-x-hidden`}>
          <div className='flex flex-col items-start justify-between py-2 md:items-end md:flex-row'>
            <div className='flex items-end gap-2 pl-2'> 
              <span className='text-3xl'>Customers List</span>
              <span className='text-sm text-gray-700'>View / Search {customerType === 'offline' ? 'Offline' : 'Online'} Customers</span>               
            </div>  
            <div className='flex gap-2 pl-2 pr-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:bg-transparent'>
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home</NavLink>
              <span></span>
              <NavLink to="/customer/import" className="text-gray-700 no-underline">Import Customers</NavLink>
              <span></span>
              <NavLink to="/customer/view" className="text-gray-700 no-underline">Customers</NavLink>                   
            </div>
          </div>

          <div className='w-full mx-auto bg-white border-t-4 border-collapse rounded-lg shadow-md border-opacity-55 border-t-blue-600'>
            <div className='flex flex-col items-center justify-start px-3 py-2 sm:justify-between sm:flex-row'>
              <div className='flex items-center'>
                <Input type="checkbox" />
                View Account Receivable Customers
              </div>
              <button className='flex-shrink-0 px-4 py-2 font-bold text-center text-white bg-blue-600 rounded cursor-pointer hover:bg-blue-700' 
                onClick={() => Navigate(customerType === 'offline' ? "/customer/add" : "/customer/app/create")}>
                <span className='text-xl'>+</span>Create {customerType === 'offline' ? 'Offline' : 'Online'} Customer
              </button>
            </div>

            <div className='flex border-b'>
              <button 
                className={`flex-1 py-2 text-center ${customerType === 'offline' ? 'bg-blue-100 border-b-2 border-blue-600' : 'bg-gray-100'}`}
                onClick={() => { setCustomerType('offline'); setCurrentPage(1); }}
              >
                Offline Customers
              </button>
              <button 
                className={`flex-1 py-2 text-center ${customerType === 'online' ? 'bg-blue-100 border-b-2 border-blue-600' : 'bg-gray-100'}`}
                onClick={() => { setCustomerType('online'); setCurrentPage(1); }}
              >
                Online Customers
              </button>
            </div>

            <div className=''>
              <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
                <div className="flex items-center px-2 space-x-2">
                  <span className="text-sm">Show</span>
                  <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={handleEntriesChange}>
                    {entries_options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <span className="text-sm">Entries</span>
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className='flex items-center justify-between flex-1 gap-2 px-2'>
                    {button.map((btn, index) => (
                      <button 
                        key={index} 
                        onClick={() => {
                          if (btn === "Copy") handleCopy();
                          if (btn === "Excel") handleExcelDownload();
                          if (btn === "PDF") handlePdfDownload();
                          if (btn === "Print") handlePrint();
                          if (btn === "CSV") handleCsvDownload();
                        }} 
                        className="px-3 py-2 text-sm text-white bg-cyan-500"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full p-2 text-sm border border-gray-300 rounded-sm md:w-auto" 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
              </div>

              <div className='w-full overflow-x-auto'>
                <table className='w-full border-separate'>
                  <thead className='text-sm'>
                    <tr className="bg-gray-200">
                      <th className="px-4 py-2 text-left">
                        <Input type="checkbox" id="table_head" checked={check} onChange={() => setCheckbox(!check)} />
                      </th>
                      <th className="px-4 py-2 text-left">CUSTOMER ID</th>
                      <th className="px-4 py-2 text-left">CUSTOMER Name</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Credit card limit</th>
                      <th className="px-4 py-2 text-left">Previous due</th>
                      <th className="px-4 py-2 text-left">Sales return due</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      {customerType === 'offline' && <th className="px-4 py-2 text-left">Action</th>}
                    </tr>
                  </thead>

                  <tbody className='border-gray-100 border-1'>
                    {filteredData.length <= 0 && (
                      <tr>
                        <td className='px-4 py-2 text-center border-gray-100 border-1' colSpan={customerType === 'offline' ? '11' : '10'}>No Data Available</td>
                      </tr>
                    )}
                    {filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((item, index) => (
                      <tr key={index}>
                        <td className='px-4 py-2 border-gray-100 border-1'>
                          <Input type="checkbox" id="table_body" checked={check || singleCheck.includes(item._id)} onChange={() => single(item._id)} />
                        </td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item._id}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{customerType === 'offline' ? item.customerName : item.name}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{customerType === 'offline' ? item.mobile : item.phone}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{item.email || 'N/A'}</td>
                        <td className='px-2 py-2 border-gray-100 border-1'>
                          {customerType === 'offline' ? (item.address?.locationLink || "No Location link") : (item.city || "N/A")}
                        </td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{customerType === 'offline' ? item.creditLimit : 0}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{customerType === 'offline' ? item.previousDue : 0}</td>
                        <td className='px-4 py-2 border-gray-100 border-1'>{customerType === 'offline' ? (item.salesReturnDue || 0) : 0}</td>
                        <td className='px-4 py-2 border-gray-100 border-1' 
                            onClick={() => setStatus((prev) => 
                              prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                            )}>
                          {status.includes(item._id) ? (
                            <span className="p-1 text-white bg-red-700 rounded-md">Inactive</span>
                          ) : (
                            <span className="p-1 text-white bg-green-400 rounded-md">Active</span>
                          )}
                        </td>
                        {customerType === 'offline' && (
                          <td className='py-2 border-gray-100 border-1'>
                            <select className='py-1 text-sm border rounded-sm' onChange={(e) => handleAction(e, item._id)}>
                              <option value="" selected disabled>Actions</option>
                              <option value="discount">Generate Discount Coupon</option>
                              <option value="edit">Edit</option>
                              <option value="view">View Payment</option>
                              <option value="delete">Delete</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredData.length > 0 && customerType === 'offline' && (
                      <tr>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        <td className='px-4 py-2 font-bold text-right bg-gray-200'>Total:</td>
                        <td className='px-4 py-2 bg-gray-200'>{total}</td>
                        <td className='px-4 py-2 bg-gray-200'>{previousDue}</td>
                        <td className='px-4 py-2 bg-gray-200'>{sales}</td>
                        <td className='px-4 py-2 bg-gray-200'></td>
                        {customerType === 'offline' && <td className='px-4 py-2 bg-gray-200'></td>}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
                <span>
                  Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries
                </span>
                <div className='flex justify-between w-full md:w-auto md:gap-2'>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
                      ${currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
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
                      ${(currentPage === totalPages || totalPages === 0) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
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