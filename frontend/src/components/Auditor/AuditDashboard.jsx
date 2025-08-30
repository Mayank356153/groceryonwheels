
import { useState,useEffect } from "react";

// import MetricCard from "./MetricCard";
// import Card from "./Card";
import axios from "axios";
import { FaBoxes,FaBoxOpen,} from 'react-icons/fa';


import AuditorSidebar from "./AuditorSidebar";

import MetricCard from "../Dashboard/MetricCard";
import AuditorNavbar from "./AuditorNavBar";
const AuditDashboard = () => {
   const [isSidebarOpen,setSidebarOpen]=useState(true)
  const [data,setData]=useState([])
  const [totalItems,setTotalItems]=useState(0)

   
   useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])
useEffect(() => {

  const fetchBucket = async () => {
    try {
      const id=localStorage.getItem("id")
    
      const response = await axios.get(`/api/audit/bucket/auditor/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      console.log(response.data);
      setData(response.data.data)
      const items = response.data.data.reduce((total, obj) => total + (obj.items?.length || 0), 0);
      setTotalItems(items)
    } catch (err) {
      console.log("Fetch error:", err.message);
    }
  };

  fetchBucket(); // ✅ Now this is properly placed
}, []);

 
  
   
  return (
    <div className="flex flex-col ">
    {/* Navbar */}
    <AuditorNavbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Main Content */}
        <div className="box-border flex ">
          {/* Sidebar */}
          
        {/* Sidebar component with open state */}
          <div className="w-auto">
        <AuditorSidebar isSidebarOpen={isSidebarOpen} />
            
          </div>

<div className="w-full min-h-screen p-4 md:p-6 bg-gray-50">
  {/* Header with decorative elements */}
  <header className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Auditor Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of storage metrics</p>
    </div>
    
  </header>

  {/* Metrics Grid - responsive columns */}
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
    {/* Total Buckets Card */}
    <MetricCard
      title="Total Buckets"
      value={data.length}
      icon={FaBoxOpen}
      description="Active storage containers"
      className="flex flex-col justify-between h-full p-6 text-white transition-all duration-300 transform shadow-lg rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-xl hover:-translate-y-1"
      valueClassName="text-3xl font-bold"
      titleClassName="text-sm font-medium opacity-90"
    />

    {/* Total Items Card */}
    <MetricCard
      title="Total Items"
      value={totalItems}
      icon={FaBoxes }
      description="Across all buckets"
      className="flex flex-col justify-between h-full p-6 text-white transition-all duration-300 transform shadow-lg rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 hover:shadow-xl hover:-translate-y-1"
      valueClassName="text-3xl font-bold"
      titleClassName="text-sm font-medium opacity-90"
    />

    {/* Additional Metrics (examples) */}
   
  </div>

  {/* Recent Activity Section */}
 
</div>
          
          

       
  
    
    </div>
    </div>
  );
};


export default AuditDashboard;
