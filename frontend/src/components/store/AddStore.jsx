import React, { useState ,useEffect} from "react";
import StoreTab from "./StoreTab.jsx";
import SystemTab from "./SystemTab.jsx";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";

const AddStore = () => {
  const [activeTab, setActiveTab] = useState("store");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  
  
  return (
    <div className="flex flex-col h-screen">
      {/* Pass sidebar state to Navbar and Sidebar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div className="w-auto">
          
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        

        <div className="w-full min-h-screen overflow-x-auto bg-gray-100">
          <div className="text-[32px] px-4">Store</div>
          <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("store")}
                className={`py-2 px-4 font-semibold ${
                  activeTab === "store"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                Store
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`py-2 px-4 font-semibold ${
                  activeTab === "system"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                System
              </button>
            </div>

            <div className="mt-6">
              {activeTab === "store" && <StoreTab />}
              {activeTab === "system" && <SystemTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStore;
