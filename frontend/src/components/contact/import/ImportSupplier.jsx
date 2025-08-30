
import React,{useEffect} from 'react';
import Button from '../Button'; // Reusable Button component
import Input from '../Input'; // Reusable Input component
import Navbar from '../../Navbar'; // Navigation bar component
import Sidebar from '../../Sidebar'; // Sidebar component
import { NavLink } from 'react-router-dom'; // For navigation links
import {FaTachometerAlt} from "react-icons/fa";

export default function ImportSupplier() {
  // Define CSV column requirements for suppliers
  const Supplier_Instructions = [
    { column: "Supplier Name", value: "Required" },
    { column: "Mobile", value: "Optional" },
    { column: "Email", value: "Optional" },
    { column: "Phone", value: "Optional" },
    { column: "GST Number", value: "Optional" },
    { column: "TAX Number", value: "Optional" },
    { column: "Country Name", value: "Optional" },
    { column: "State Name", value: "Optional" },
    { column: "Postcode", value: "Optional" },
    { column: "Address", value: "Optional" },
    { column: "Opening Balance", value: "Optional" }
  ];

  // State management
  const [isSidebarOpen, setSidebarOpen] = React.useState(false); // Sidebar visibility
  const [fileLocation, setFileLocation] = React.useState(""); // Store selected file
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form behavior
    console.log("Selected file:", fileLocation); // Log file for verification
    setFileLocation(""); // Reset file input
  }

  return (
    <div className='flex flex-col h-screen'>
      {/* Top Navigation Bar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className='flex flex-grow mt-20'>
        {/* Sidebar Component */}
        <div>
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        {/* Main Content Area */}
        <div className='w-full h-full px-6 py-4 bg-gray-300'>
          {/* Page Header Section */}
          <div className='flex flex-col items-end justify-between md:flex-row'>
            <div className='flex items-end w-full gap-2 md:w-1/2'> 
              <span className='text-3xl '>Import Suppliers</span>
              <span className='text-sm text-gray-700'>Add/Update Brand</span>               
            </div>  
            
            {/* Breadcrumb Navigation */}
            <div className='flex w-full gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home</NavLink>
              <span>&gt;</span>
              <NavLink to="/supplier/view" className="text-gray-700 no-underline">Suppliers List</NavLink>
              <span>&gt;</span>
              <NavLink to="/supplier/import" className="text-gray-700 no-underline">Import Suppliers</NavLink>
            </div>
          </div>

          {/* CSV Upload Section */}
          <div className="w-full pb-4 mx-auto bg-white border-t-4 rounded border-t-blue-600">
            <div className="px-2 py-2 text-xl font-light border-b-2 border-gray-200">
              <span>Please Enter Valid Data</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col px-2 py-2 text-start">
                {/* File Input Field */}
                <Input 
                  label="Import Supplier *" 
                  div_class="flex gap-2 sm:items-center sm:flex-row flex-col" 
                  label_class="mb-1" 
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFileLocation(e.target.files[0])}
                  className="w-full px-2 py-2 bg-gray-100 border-2 border-gray-300 rounded cursor-pointer sm:w-auto hover:bg-gray-300"
                />
                <span className="text-red-500 text-md">Note: File must be in CSV Format</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-between gap-2 py-4 border-t-2 border-t-gray-200 sm:pl-20 sm:justify-start md:flex-row">
                <Button 
                  text="Import" 
                  type="submit" 
                  className="px-20 py-2 font-semibold text-white bg-green-500 rounded cursor-pointer sm:mr-4 hover:bg-green-600" 
                />
                <Button 
                  text="Close" 
                  className="px-20 py-2 font-semibold text-white bg-orange-500 rounded cursor-pointer sm:mr-4 hover:bg-orange-600" 
                />
              </div>
            </form>
          </div>

          {/* Import Instructions Section */}
          <div className="p-6 mt-20 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-between pb-4 mb-4 border-b-2 sm:flex-row">
              <h1 className="text-xl font-semibold">Import Instructions</h1>
              {/* Example CSV Download Button */}
              <button 
                className="px-4 py-2 text-white bg-blue-500 rounded"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = "/import-suppliers-example.csv";
                  link.download = "import-suppliers-example.csv";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download Example Format
              </button>
            </div>

            {/* Requirements Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">#</th>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">Column Name</th>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">Value</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {Supplier_Instructions.map((data, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border-2 border-gray-200">{index + 1}</td>
                      <td className="px-4 py-2 border-2 border-gray-200">{data.column}</td>
                      <td className="px-4 py-2 border-2 border-gray-200">
                        {data.value === "Required" ? (
                          <span className="text-white bg-green-400 rounded text-sm font-light px-1 py-1 text-[10px]">
                            Required
                          </span>
                        ) : (
                          <span className="text-black bg-gray-400 rounded text-[10px] font-light px-1 py-1">
                            Optional
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}