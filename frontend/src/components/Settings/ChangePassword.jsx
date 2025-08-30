import React, { useState,useEffect } from 'react';
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";

const ChangePassword = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    // Handle the logic for saving the new password...
    alert("Password changed successfully!");
  };

  return (
<div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                
              {/* Sidebar component with open state */}
              <Sidebar isSidebarOpen={isSidebarOpen} />
                
                 {/* Content */}
         <div className={`flex-grow  flex flex-col p-2 md:p-2 min-h-screen w-full`}>

      <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
        <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
          <h1 className="text-lg font-semibold truncate sm:text-xl">Change Password</h1>
          <span className="text-xs text-gray-600 sm:text-sm">Please Enter Valid Data</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
          <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
          </a>
          <BiChevronRight className="mx-1  sm:mx-2" />
          <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Change Password</a>
        </nav>
      </header>

      <div className="p-6 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
        <form className="space-y-2">
          <div className='flex gap-4'>
            <label className="block text-sm font-medium text-gray-700">Current Password <span className='text-red-500'>*</span></label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="block w-64 w-1/2 p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-cyan-200"
              placeholder="Enter current password"
            />
          </div>
          <div className='flex gap-11'>
            <label className="block text-sm font-medium text-gray-700">New Password <span className='text-red-500'>*</span></label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="block w-64 w-1/2 p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-cyan-200"
              placeholder="Enter new password"
            />
          </div>
          <div className='flex gap-4'>
            <label className="block text-sm font-medium text-gray-700">Confirm Password <span className='text-red-500'>*</span></label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-64 w-1/2 p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-cyan-200"
              placeholder="Confirm your new password"
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button
              type="button"
              onClick={handleSave}
              className="px-12 py-2 text-white bg-green-500 hover:bg-green-600 focus:outline-none"
            >
              Save
            </button>
            <button
              type="button"
              className="px-12 py-2 text-white bg-orange-500 hover:bg-orange-600 focus:outline-none"
            >
              Close
            </button>
          </div>
        </form>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ChangePassword;
