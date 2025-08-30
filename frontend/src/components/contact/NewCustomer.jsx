import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import Select from 'react-select';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { FaTachometerAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
export default function Customer() {
   const[isSidebarOpen,setSidebarOpen]=useState(true)
  


   useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch('api/get-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          });

          const data = await res.json();
          setFormData((prev)=>({
            ...prev,
            state:data.state,
            country:data.country
          }))

        } catch (err) {
          console.error("Location fetch error:", err);
        }

      }, (err) => {
        console.error("Geolocation denied or failed:", err);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);
   
      
    const[formData,setFormData]=useState({
        type:"Online"
    })
     


    
//Function to handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]:(e.target.type=="Number")? Number(value):value });
    };

   
    
//Function to handle file input changes
    const handleFileChange = (e) => {
        setFormData({ ...formData, attachment: e.target.files[0].name });
    };


    const postData = async () => {
       
            try {
              console.log("Sending FormData:", formData);
              const response = await axios.post(
                "api/customer/add",
                formData
              );
              console.log("Response:", response.data);
              alert(" Added Successfully");
            } catch (err) {
              console.error("Error:", err.response?.data || err.message);
              alert("Unsuccessful: " + (err.response?.data?.message || err.message));
            }
           
            
          };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData)
        await postData();
        // Here you can send formData to your API
    };

    const handleReset=()=>{
        setFormData({
            address:{
                city:"",state:"",postcode:"",locationLink:"",area:"",country:""
              },
              attachmentPath: "",
              creditLimit: 0,
              customerImage:"",
              customerName: '',
              customerId:'',
              email: '',
              gstNumber: '',
              mobile: '',
              openingBalancePayments:[],
               panNumber:"",
               phone:"",
               previousDue:0,
               priceLevel:0,
               priceLevelType:"",
               salesReturnDue:0,
               shippingAddress:{
                 area:"",
                 city:"",
                 locationLink:"",
                 postcode:"",
                 state:""
               },
               taxNumber:""
        })
    }

    return (
        <div className='flex flex-col h-screen'>
        {/* Navbar component with sidebar open state */}
        <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className='box-border flex'>
          <div className='w-auto'>
            {/* Sidebar component with open state */}
            <Sidebar isSidebarOpen={isSidebarOpen} />
          </div>
        
          {/* Container for the entire component */}
          <div className='w-full h-full px-6 py-4 overflow-x-auto bg-gray-300'>
        
            <div className='flex flex-col items-end justify-between md:flex-row'>
              <div className='flex items-end w-full gap-2 md:w-1/2'> 
                <span className='text-3xl '>Customers</span>
                <span className='text-sm text-gray-700'>Enter User Information</span>               
              </div>  
              <div className='flex w-full gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
                {/* Navigation links for breadcrumb navigation */}
                <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
                <span>&gt;</span>
                <NavLink to="/customer/view" className="text-gray-700 no-underline">View Users</NavLink>
                <span>&gt;</span>
                <NavLink to="/customer/add" className="text-gray-700 no-underline">Customers</NavLink>                   
              </div>
            </div>            
        
            {/* Inner container with padding and styling */}
            <div className="p-6 mx-auto bg-white rounded-lg shadow-md "> 
             
              <div className="p-6 mx-auto bg-white b">
                    <form onSubmit={handleSubmit} onReset={handleReset}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input
                                label="Customer Name"
                                name="customerName"
                                value={formData.customerName || ""}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="Mobile"
                                name="mobile"
                                value={formData.mobile || ""}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="State"
                                name="state"
                                value={formData.state || ""}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="Country"
                                name="country"
                                value={formData.country || ""}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="Sector"
                                name="sector"
                                value={formData.sector}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="House No."
                                name="houseNo"
                                value={formData.houseNo}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                            />
                            <Input
                            // type="number"
                                label="Location Link"
                                name="locationLink"
                                value={formData.locationLink}
                                onChange={handleChange}
                                className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                                label_class='block text-sm font-medium text-gray-700'
                                div_class='flex flex-col'
                                
                                // min='0'
                            />
                            <div>
                                <Input
                                    type="file"
                                    label="Attachment"
                                    onChange={handleFileChange}
                                    className='w-full p-2 mt-1 text-gray-700 bg-gray-200 border rounded-md shadow-sm cursor-pointer hover:bg-gray-300'
                                    label_class='block text-sm font-medium text-gray-700'
                                />
                                <p className="text-xs text-red-500">Size: 2MB</p>
                                {/* <Button className="mt-2 bg-green-500 text-white px-2 py-2 font-bold text-[10px]  cursor-pointer hover:bg-green-600 rounded-md" text="Click to view" /> */}
                            </div>
                        </div>
                      
                       
                        <div className="flex flex-col justify-center gap-2 mt-6 mb-2 md:flex-row md:gap-5">
                                 <Button className="px-20 py-2 text-white bg-green-500 rounded hover:bg-green-600" type='submit' text="Next" />
                                 <Button className="px-20 py-2 text-white bg-orange-500 rounded hover:bg-orange-600" text="Close" type='reset' />
                        </div>
                    </form>
                   
                </div>
             
            </div>
          </div>
          
        </div>
        </div>
    );
}

