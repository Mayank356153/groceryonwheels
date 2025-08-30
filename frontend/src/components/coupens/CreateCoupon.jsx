import React, { useState,useEffect } from "react";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import {BiHome, BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios from "axios";
const Coupon = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [coupons,setCoupons]=useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const fetchCustomerCoupons = async () => {
    try {
      const response = await  axios.get('api/discount-coupons', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) 
      console.log(response.data) 
      setCoupons(response.data)
    } catch (err) {
      console.log(err.message);
    }
  };
  useEffect(()=>{
    fetchCustomerCoupons();
  },[])
  const filteredData = coupons.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
  
    // Check if customer name or mobile matches the search term
    const customerMatch = 
        item.occasionName.toLowerCase().includes(searchTermLower) ||
        item.couponType.toLowerCase().includes(searchTermLower);
    // Return combined filter conditions
    return (customerMatch);
  });
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
 

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
         <div className={`flex-grow mt-24 flex flex-col p-2 md:p-2 min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
      <header className='flex items-center justify-between'>
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
          <h1 className="text-lg font-semibold truncate sm:text-xl">Discount Coupon </h1>
          <span className="text-xs text-gray-600 sm:text-sm">Add/Update Coupon</span>
        </div>
     <div>
     <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
          <a href="#" className="flex items-center text-gray-800 no-underline hover:text-cyan-500"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-500"/> Home</a>
          <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
          <a href="#" className="text-gray-800 no-underline hover:text-cyan-500">Discount Coupons</a>
          <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
          <a href="#" className="text-gray-800 no-underline hover:text-cyan-500">Discount Coupons</a>
        </nav>
        </div>
        </header>
       <div>
        <div className="w-full p-6 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Discount Coupons</h3>
            <button className="px-4 py-2 text-white transition rounded-lg bg-cyan-300 hover:bg-cyan-500">+ Create Coupon</button>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col gap-4 p-4 rounded-md md:flex-row md:justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <label className="text-sm/6">Show</label>
              <select 
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 text-sm/6"
                value={entriesPerPage} 
                onChange={(e) => setEntriesPerPage(parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <label className="text-sm/6">Entries</label>
            </div>
            <div className="flex flex-wrap items-center gap-0.5">
              {["Copy", "Excel", "PDF", "Print", "CSV"].map((text) => (
                <button key={text} className="p-2 text-white border border-gray-300 hover:bg-cyan-500 text-sm/6 bg-cyan-300">
                  {text}
                </button>
              ))}
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md md:w-auto focus:ring-2 focus:ring-blue-400 text-sm/6"
              />
            </div>
          </div>

          {/* Coupon Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full bg-white border border-gray-300 rounded-md shadow-md">
              <thead className="bg-gray-200">
                <tr>
                  {["Occasion Name", "Expire Date", "Value", "Coupon Type", "Status", "Action"].map((heading) => (
                    <th key={heading} className="p-3 text-sm font-medium text-left border text-sm/6">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No data available in table</td>
                  </tr>
                ) : (
                  filteredData.map((coupon) => (
                    <tr key={coupon._id} className="transition border hover:bg-gray-100 ">
                      <td className="p-3 border">{coupon.occasionName}</td>
                      <td className="p-3 border">{new Date(coupon.expiryDate).toDateString()}</td>
                      <td className="p-3 border">{coupon.value}</td>
                      <td className="p-3 border">{coupon.couponType}</td>
                      <td className="p-3 border">{coupon.status.toLowerCase()=="active"?<span className='p-1 text-white bg-green-400 rounded-md'>Active</span>:<span className='p-1 text-white bg-red-500 rounded-md'>InActive</span>}</td>
                      <td className="p-3">
                        <button className="px-4 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600 text-sm/6">Action</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
            <div className="text-sm text-gray-600">Showing 0 to 0 of 0 entries</div>
            <div className="flex gap-2">
              <button className="p-2 text-sm border rounded-md hover:bg-gray-100 text-sm/6">Previous</button>
              <button className="p-2 text-sm border rounded-md hover:bg-gray-100 text-sm/6">Next</button>
            </div>
          </div>
        </div>
      </div>
      <div/>
    </div>
    </div>
    </div>
  );
};

export default Coupon;
