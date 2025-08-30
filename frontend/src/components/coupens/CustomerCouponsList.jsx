import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { FaTachometerAlt,FaEdit,FaTrash } from "react-icons/fa";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import AllowedList from './AllowedList.jsx';
const MoneyTransferList = () => {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const[currentPage,setCurrentPage]=useState(1)
  const [searchTerm, setSearchTerm] = useState('');
  const transfers = []; // Dummy data
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const[coupons,setCoupons]=useState([])
  const[loading,setLoading]=useState(false)
    const[allowedListView,setAllowedListView]=useState(false)
    const[coupon,setCoupon]=useState({})
  const fetchCustomerCoupons = async () => {
    try {
      setLoading(true)
      const response = await  axios.get('api/customer-coupons', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) 
      console.log(response.data) 
      setCoupons(response.data)
    } catch (err) {
      console.log(err.message);
    }
    finally{
      setLoading(false)
    }
  };
  useEffect(()=>{
    fetchCustomerCoupons();
  },[])
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const filteredData = coupons.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
  
    // Check if customer name or mobile matches the search term
    const customerMatch = 
        item.customer?.customerName?.toLowerCase().includes(searchTermLower) ||
        item.customer?.mobile?.toLowerCase().includes(searchTermLower);
    // Return combined filter conditions
    return (customerMatch);
  });
  
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
  const handleCopy = () => {
          const data = coupons.map(coupon => `${coupon.customer?.customerName || "NA"}, ${coupon.occasionName}, ${coupon.couponCode},${new Date(coupon.expiryDate).toDateString()},${coupon.value},${coupon.couponType},${coupon.description},${coupon.status}`).join('\n');
          navigator.clipboard.writeText(data);
          alert("Data copied to clipboard!");
      };
  
      const handleExcelDownload = () => {
          const ws = XLSX.utils.json_to_sheet(coupons);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "CustomerCoupons");
          XLSX.writeFile(wb, "customer_coupon.xlsx");
      };
  
      const handlePdfDownload = () => {
          const doc = new jsPDF();
          doc.text("Customer Coupon List", 20, 20);
          const tableData = coupons.map(exp => [
              exp.customer?.customerName || "NA",
              exp.occasionName,
              exp.couponCode,
              new Date(exp.expiryDate).toDateString(),
              exp.value,
              exp.couponType,
              exp.description,
              exp.status,
          ]);
          autoTable(doc, {
              head: [["Customer Name", "Occasion Name", "Coupon Code", "Expire Date", "Value", "Coupon Type", "Description", "Status"]],
              body: tableData,
          });
          doc.save('customerCoupon.pdf');
      };
  
      const handlePrint = () => {
          window.print();
      };
      const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + coupons.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customer_coupon.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
const[dropdownIndex,setDropdownIndex]=useState(null)  
  const toggleDropdown = (index) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
  };

  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete this")
    if(!conf){
      return ;
    }
    setLoading(true)
   
    try {
      const response = await axios.delete(`api/customer-coupons/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{
       await fetchCustomerCoupons()
      setLoading(false)
    }
  };



  
  const updateData = async (id, newStatus) => {
    setLoading(true);
    
    try {
        const response = await axios.put(
            `api/customer-coupons/${id}`,
            { status: newStatus }, // ✅ Send only the status field
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // ✅ Prevent null token issues
                },
            }
        );

        alert("Update Successfully");
        fetchCustomerCoupons(); // Fetch updated data after successful update
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        alert("Unsuccessful: " + (err.response?.data?.message || err.message));
    } finally {
        setLoading(false);
    }
};
const[update,setUpdate]=useState({})
// ✅ Keep only status when calling the update function
const handleStatus = (id) => {
    const selectedCategory = coupons.find((item) => item._id === id);

    if (!selectedCategory) {
        console.error("Category not found for ID:", id);
        return;
    }

    const newStatus = selectedCategory.status === "Active" ? "Inactive" : "Active";

    updateData(id, newStatus); // ✅ Send only status, not the full object

    // ✅ Update local state immediately (for UI consistency)
    setUpdate((prev) => ({ ...prev, [id]: newStatus }));
};

  
  return (
    <div className="flex flex-col h-screen">
    {/* Navbar */}
    <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Main Content */}
        <div className="flex flex-grow">
          {/* Sidebar */}
          <div>
        {/* Sidebar component with open state */}
        <Sidebar isSidebarOpen={isSidebarOpen} />
          </div>
           {/* Content */}
   <div className={`flex-grow  flex flex-col p-2 md:p-2 min-h-screen`}>
  {
                  allowedListView && (
                    <AllowedList
                      coupon={coupon} onClose={()=>{setAllowedListView(false) ;setSidebarOpen(true)}}/>
                  )
                 }
        {/* Header Section */}
        <div className="flex flex-col items-center justify-between p-4 mb-6 bg-white rounded shadow md:flex-row">
          <h2 className="text-lg font-bold text-center md:text-left">Customer Coupons List</h2>
          <p className="flex text-sm text-center text-gray-500 hover:text-cyan-500 md:text-left"><FaTachometerAlt className="mt-1 mr-2 text-gray-500 hover:text-cyan-500" />Home &gt; Customer Coupons List</p>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col items-center justify-between p-4 mb-4 border-t-4 rounded md:flex-row border-cyan-500">
          <h3 className="font-semibold text-center text-md md:text-left">Customer Coupons List</h3>
          <button className="flex items-center w-full gap-2 px-4 py-2 mt-2 text-white rounded bg-cyan-300 hover:bg-cyan-500 md:w-auto md:mt-0"onClick={()=>navigate("/create")}>
            <FaPlus /> Create Coupon
          </button>
        </div>

        {/* Table Controls Section */}
        <div className="flex flex-col items-center justify-between gap-2 p-4 mb-4 rounded md:flex-row">
          {/* Entries Per Page */}
          <div className="flex items-center gap-2">
            <label className="text-sm/6">Show</label>
            <select
              className="px-2 py-1 border rounded text-sm/6"
              value={entriesPerPage}
              onChange={handleEntriesChange}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <label className="text-sm/6">Entries</label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center md:justify-end gap-0.5 w-full md:w-auto mt-1 md:mt-0">
          <button  className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleCopy}>
                Copy
              </button>
              <button  className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleExcelDownload}>
                Excel
              </button>
              <button  className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handlePdfDownload}>
                PDF
              </button>
              <button  className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handlePrint}>
                Print
              </button>
              <button  className="w-full px-3 py-1 text-white bg-cyan-300 hover:bg-cyan-500 md:w-auto text-sm/6" onClick={handleCsvDownload}>
                CSV
              </button>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border md:w-auto text-sm/6"
            />
          </div>
        </div>

        {/* Money Transfer Table */}
        <div className="p-4 overflow-x-auto rounded">
          <table className="w-full text-sm border border-collapse border-gray-300 md:text-base">
            <thead>
              <tr className="text-center bg-gray-200">
                <th className="p-2 border text-sm/6">Customer Name</th>
                <th className="p-2 border text-sm/6">Occasion Name</th>
                <th className="p-2 border text-sm/6">Coupon Code</th>
                <th className="p-2 border text-sm/6">Expire Date</th>
                <th className="p-2 border text-sm/6">Value</th>
                <th className="p-2 border text-sm/6">Coupon Type</th>
                <th className="p-2 border text-sm/6">Description</th>
                <th className="p-2 border text-sm/6">Status</th>
                <th className="p-2 border text-sm/6">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-gray-500 border">
                    No data available in table
                  </td>
                </tr>
              ) : (
               currentUsers.map((coupon, index) => (
                  <tr key={index} className="text-center">
                    <td className="p-2 border">{coupon.customer?.customerName || "NA"}</td>
                    <td className="p-2 border">{coupon.occasionName}</td>
                    <td className="p-2 border">{coupon.couponCode}</td>
                    <td className="p-2 border">{new Date(coupon.expiryDate).toDateString()}</td>
                    <td className="p-2 border">{coupon.value}</td>
                    <td className="p-2 border">{coupon.couponType}</td>
                    <td className="p-2 border">{coupon.description}</td>
                    <td className="p-2 border"onClick={()=>handleStatus(coupon._id)}>{coupon.status.toLowerCase()=="active"?<span className='p-1 text-white bg-green-400 rounded-md'>Active</span>:<span className='p-1 text-white bg-red-500 rounded-md'>InActive</span>}</td>
                    <td className="p-2 border">
                     <button
                       onClick={() => toggleDropdown(coupon._id)}
                          className="px-3 py-1 text-white rounded bg-cyan-600"
                            >
                          Action ▼
                          </button>
                           {dropdownIndex === coupon._id && (
                           <div className="absolute z-10 w-32 -mt-5 bg-white border border-gray-200 rounded-md shadow-md right-12">
                             <button 
        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
          setSidebarOpen(false);
          setAllowedListView(true);
          setCoupon(coupon);  
        }}
      >
        View Details
      </button>
                           <button className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"onClick={()=>navigate(`/create?couponid=${coupon._id}`)}>
                           <FaEdit className="mr-2" /> Edit
                           </button>
                           <button className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"onClick={()=>handleDelete(coupon._id)}>
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

        {/* Pagination Section */}
        <div className="flex items-center justify-between mt-4">
                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, coupons.length)} of {coupons.length} entries</span>
                    <div>
                        <button onClick={handlePageChange} className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>
                            Previous
                        </button>
                        <button onClick={handlePageChange} className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default MoneyTransferList;
