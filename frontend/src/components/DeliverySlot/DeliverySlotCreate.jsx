import React, { useEffect, useState } from "react";
import { BiChevronDown, BiChevronUp, BiX, BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import { NavLink } from 'react-router-dom';
import LoadingScreen from "../../Loading.jsx";
import Button from "../contact/Button.jsx";
import TimePicker from "./TimePicker.jsx"
const DeliverySlotCreate = () => {
  const[isSidebarOpen,setSidebarOpen]=useState(true)
  const[loading,setLoading]=useState(false)
 
 
  useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])

  const[formData,setFormData]=useState({
    startTime:"",
    endTime:"",
    fee:0
  })

useEffect(()=>console.log(formData),[formData])


const handleSubmit=async (e)=>{
    e.preventDefault();
    try{
        const response =await axios.post('api/delivery/slot/create',formData)
        console.log(response)
        alert("slot created successfully")
        setFormData({
             startTime:"",
    endTime:"",
    fee:0
        })
    }
    catch(error){
        console.error("Error in creating slot",error.message)
    }
}
const handleReset=(e)=>{
    e.preventDefault();
     setFormData({
             startTime:"",
    endTime:"",
    fee:0
        })
}

   
   if(loading) return (<LoadingScreen />)
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">

        <Sidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`flex-grow flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow lg:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">New Delivery Slot</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Delivery Slot</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/delivery-slot/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Delivery Slot List
                          </NavLink>    
                          <NavLink to="/delivery-slot/create" className="text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Add Delivery Slot List
                          </NavLink>
              
            </nav>
          </header>
          <form onSubmit={handleSubmit} onReset={handleReset}>
            
        
          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
             
          <div className="flex flex-col gap-5 md:flex-row">
      <TimePicker
        label="Start Time"
        value={formData.startTime}
        onChange={(time) => setFormData((prev)=>({...prev,startTime:time}))}
      />
      
      <TimePicker
        label="End Time"
        value={formData.endTime}
        onChange={(time) => setFormData((prev)=>({...prev,endTime:time}))}
      />
    </div>

<div className="flex justify-between w-full gap-5">
  <div className="flex flex-col w-full gap-1">
    <label htmlFor="fee">Fee</label>
    <input
      type="number"
      name="fee"
      id="fee"
      min="0"
      value={formData.fee}
      onChange={(e)=>setFormData((prev)=>({...prev,fee:Number(e.target.value)}))}
      defaultValue="0"
      className="w-full px-2 py-2 border-2 rounded-md"
    />
  </div>
  <div className="flex flex-col w-full gap-1">
    {/* Empty div maintained for layout consistency */}
  </div>
</div>

               <div className='flex flex-col items-center justify-around w-full gap-2 mx-auto mt-5 sm:flex-row'>
                              <Button className="w-full text-white bg-green-500 rounded cursor-pointer hover:bg-green-600" type='submit' text="Save"/> {/* Save button */}
                              <Button className="w-full text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600" text="Reset" type='reset' /> {/* Close button */}
         </div>
               
               
                
                
                 
          
            </div>

             </form> 
          </div>
        </div>
      </div>
    
  );
};

export default DeliverySlotCreate;
