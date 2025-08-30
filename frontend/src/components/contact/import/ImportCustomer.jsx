import React,{useEffect} from 'react';
import Button from '../Button'; // Importing the Button component
import Input from '../Input'; // Importing the Input component
import Navbar from '../../Navbar'; // Importing the Navbar component
import Sidebar from '../../Sidebar'; // Importing the Sidebar component
import { NavLink } from 'react-router-dom'; // Importing NavLink for navigation
import {FaTachometerAlt} from "react-icons/fa";

export default function ImportCustomer() {
  // State to manage the sidebar open/close status
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
  // Instructions for importing customers
  const customer_instruction = [
    { column: "Customer Name", value: "Required", details: "" },
    { column: "Mobile", value: "Optional", details: "" },
    { column: "Email", value: "Optional", details: "" },
    { column: "Phone", value: "Optional", details: "" },
    { column: "GST Number", value: "Optional", details: "" },
    { column: "TAX Number", value: "Optional", details: "" },
    { column: "Previous Due", value: "Optional", details: "" },
    { column: "Credit Limit", value: "Optional", details: "[-1 for No Limit]" },
    { column: "Country Name", value: "Optional", details: "" },
    { column: "State Name", value: "Optional", details: "" },
    { column: "Postcode", value: "Optional", details: "" },
    { column: "Address", value: "Optional", details: "" },
    { column: "Location Link", value: "Optional", details: "Map Link location or URL/Web address link" },
    { column: "Shipping Country Name", value: "Optional", details: "" },
    { column: "Shipping State Name", value: "Optional", details: "" },
    { column: "Shipping Postcode", value: "Optional", details: "" },
    { column: "Shipping Address", value: "Optional", details: "" },
    { column: "Shipping Location Link", value: "Optional", details: "Map Link location or URL/Web address link" },
  ];

  // State to manage the file location
  const [fileLocation, setFileLocation] = React.useState("");
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    console.log(fileLocation); // Log the selected file location
    setFileLocation(""); // Reset the file location state
  }

  return (
    <div className='flex flex-col h-screen'>
      {/* Navbar component with sidebar open state */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className='flex flex-grow mt-20'>
        <div>
          {/* Sidebar component with open state */}
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
    
        {/* Container for the entire component */}
        <div className='w-full h-full px-6 py-4 bg-gray-300'>
          <div className='flex flex-col items-end justify-between md:flex-row'>
            <div className='flex items-end w-full gap-2 md:w-1/2'> 
              <span className='text-3xl '>Import Customers</span>
              <span className='text-sm text-gray-700'>Add/Update Brand</span>               
            </div>  
            <div className='flex w-full gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
              {/* Navigation links for breadcrumb navigation */}
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
              <span>&gt;</span>
              <NavLink to="/customer/view" className="text-gray-700 no-underline">View Users</NavLink>
              <span>&gt;</span>
              <NavLink to="/customer/import" className="text-gray-700 no-underline">Import Customers</NavLink>                   
            </div>
          </div>            
    
          {/* Form container for importing customers */}
          <div className="w-full pb-4 mx-auto bg-white border-t-4 rounded border-t-blue-600">
            <div className="px-2 py-2 text-xl font-light border-b-2 border-gray-200">
              <span>Please Enter Valid Data</span>
            </div>
    
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col px-2 py-2 text-start">
                {/* File Input Field for uploading CSV */}
                <Input 
                  label="Import Customer *" 
                  div_class="flex gap-2 sm:items-center sm:flex-row flex-col" 
                  label_class="mb-1" 
                  type="file"
                  accept=".csv" // Accept only CSV files
                  onChange={(e) => setFileLocation(e.target.files[0])} // Update file location state on file selection
                  className="w-full px-2 py-2 bg-gray-100 border-2 border-gray-300 rounded cursor-pointer sm:w-auto hover:bg-gray-300"
                />
                <span className="text-red-500 text-md ">Note: File must be in CSV Format</span>
              </div>
    
              {/* Buttons for form actions */}
              <div className="flex flex-col justify-between gap-2 py-4 border-t-2 border-t-gray-200 sm:pl-20 sm:justify-start md:flex-row">
                <Button text="Import" type="submit" className="px-20 py-2 font-semibold text-white bg-green-500 rounded cursor-pointer sm:mr-4 hover:bg-green-600" 
                />
                <Button text="Close" className="px-20 py-2 font-semibold text-white bg-orange-500 rounded cursor-pointer sm:mr-4 hover:bg-orange-600" />
              </div>
            </form>
          </div>
    
          {/* Import Instructions Table */}
          <div className="p-6 mt-20 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-between mb-5 text-left sm:flex-row">
              <h1 className="w-full text-xl font-semibold">Import Instructions</h1>
              <button className="px-4 py-2 text-sm text-white bg-blue-500 rounded "  onClick={() => {
                  const link = document.createElement("a");
                  link.href = "/import-customers-example.csv"; // Path to file in public folder
                  link.download = "import-customers-example.csv"; // Name of the file when downloaded
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  console.log("ss")
                }}>Download Example Format</button>
            </div>
    
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">#</th>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">Column Name</th>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">Value</th>
                    <th className="px-4 py-2 text-left border-2 border-gray-200">Details</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {customer_instruction.map((data, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border-2 border-gray-200">{index + 1}</td>
                      <td className="px-4 py-2 border-2 border-gray-200">{data.column}</td>
                      <td className="px-4 py-2 border-2 border-gray-200">
                        {data.value === "Required" ? (
                          <span className="text-white bg-green-400 rounded text-sm font-light px-1 py-1 text-[10px]">Required</span>
                        ) : (
                          <span className="text-black bg-gray-400 rounded text-[10px] font-light px-1 py-1">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border-2 border-gray-200">{data.details}</td>
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
