import React, { useState,useEffect } from "react";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

const ImportItems = () => {
  const [file, setFile] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
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
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Content */}
        <div className={`flex-grow  p-4 min-h-screen transition-all `}>
          {/* Header */}
          <header className="flex flex-col items-center justify-between h-8 p-4 mb-1 bg-white rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <h1 className="text-xl font-semibold text-gray-800">Import Services </h1>
              <span className="text-sm text-gray-600">Add/Update Brand</span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dahsboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="hidden mx-2 sm:inline" />
              <a href="item-list" className="text-gray-700 no-underline hover:text-cyan-600">Items List</a>
              <BiChevronRight className="hidden mx-2 sm:inline" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Import Services </a>
            </nav>
          </header>

          {/* Import Section */}
          <div className="p-4 bg-white border-t-4 rounded-md rounded-lg shadow-md border-cyan-500">
          <p className="text-lg text-fold">Please Enter Valid Data</p>
            {/* File Upload */}
            <div className="mb-2 flex gap-2.5">
              <label className="block mt-3 font-semibold text-gray-700">Import Services <span className="text-red-500">*</span></label>
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="w-64 p-2 mt-1 border rounded"
                accept=".csv"
              />
            </div>
            <p className="text-sm text-red-500">Note: File must be in CSV format.</p>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button className="flex items-center w-40 px-4 py-2 text-white bg-green-500 hover:bg-green-600">
                ⭐ Import
              </button>
              <button className="w-40 px-4 py-2 text-white bg-yellow-500 hover:bg-yellow-600">
                Close
              </button>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="p-6 mt-6 bg-white rounded-md shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Import Instructions</h3>
              <button className="px-4 py-2 text-white bg-cyan-500 hover:bg-cyan-600">
                Download Example Format
              </button>
            </div>

            {/* Table */}
            <table className="w-full border border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Column Name</th>
                  <th className="p-2 border">Value</th>
                  <th className="p-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">1</td>
                  <td className="p-2 border">Item Name</td>
                  <td className="p-2 font-semibold text-green-600 border">Required</td>
                  <td className="p-2 border"></td>
                </tr>
                <tr>
                  <td className="p-2 border">2</td>
                  <td className="p-2 border">Category Name</td>
                  <td className="p-2 font-semibold text-green-600 border">Required</td>
                  <td className="p-2 border"></td>
                </tr>
                <tr>
                  <td className="p-2 border">3</td>
                  <td className="p-2 border">Sub Category Name</td>
                  <td className="p-2 italic text-gray-500 border">Optional</td>
                  <td className="p-2 border"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportItems;
