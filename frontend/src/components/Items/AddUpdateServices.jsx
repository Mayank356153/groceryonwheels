import React, { useState,useEffect } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

const AddUpdateServices = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
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
      <div className="flex flex-col flex-grow md:flex-row">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Content */}
        <div
          className={`flex-grow p-6 mt-20 transition-all duration-300 ${
            isSidebarOpen ? "md:ml-64" : "ml-0"
          } bg-gray-100 min-h-screen`}
        >
          {/* Header Section */}
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
                   <h1 className="text-lg font-semibold truncate sm:text-xl"> Services </h1>
                   <span className="text-xs text-gray-600 sm:text-sm">Add/Update Services</span>
                 </div>
            <nav className="flex flex-wrap mt-2 text-sm text-gray-600">
              <a
                href="#"
                className="flex items-center text-gray-400 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2 text-gray-500" /> Home
              </a>
              <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
              <a href="#" className="text-gray-400 no-underline hover:text-cyan-600">
                Items List
              </a>
              <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
              <a href="#" className="text-gray-400 no-underline hover:text-cyan-600">
                Services
              </a>
            </nav>
          </header>

          {/* Form Section */}
          <div className="">
            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Item Code <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded" value="IT050001" readOnly />
              </div>
              <div>
                <label className="block font-semibold">Category <span className="text-red-500">*</span></label>
                <select className="w-full p-2 border rounded">
                  <option>-Select-</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold">Item Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold">Barcode</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold">SAC</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold">HSN</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold">Description</label>
                <textarea className="w-full p-2 border rounded"></textarea>
              </div>
              <div>
                <label className="block font-semibold">Select Image</label>
                <input type="file" className="w-full p-2 border rounded" />
                <small className="text-red-500">
                  Max Width/Height: 1000px * 1000px & Size: 1MB
                </small>
              </div>
              <div>
                <label className="block font-semibold">Discount Type</label>
                <select className="w-full p-2 border rounded">
                  <option>Percentage(%)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold">Discount</label>
                <input type="text" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold">Price (Expenses) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Price of Item without Tax"
                />
                <small className="text-blue-500">Enter "0", If there is no expenses</small>
              </div>
              <div>
                <label className="block font-semibold">Tax <span className="text-red-500">*</span></label>
                <select className="w-full p-2 border rounded">
                  <option>-Select-</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold">Sales Tax Type <span className="text-red-500">*</span></label>
                <select className="w-full p-2 border rounded">
                  <option>Inclusive</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold">Sales Price <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded" readOnly />
              </div>
              <div className="flex justify-center col-span-2 gap-4 mt-4">
                <button className="px-12 py-2 text-white bg-green-500 ">Save</button>
                <button className="px-12 py-2 text-white bg-orange-500">Close</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUpdateServices;
