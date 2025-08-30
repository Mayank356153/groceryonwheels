import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
export default function LoadingScreen() {
    const[isSidebarOpen,setSidebarOpen]=useState(false)
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 rounded-full border-cyan-500 border-t-transparent animate-spin"></div>
            <p className="mt-3 text-lg font-semibold text-gray-700">Loading...</p>
          </div>
        </div>
          
        </div>
      </div>
    );
  }
  