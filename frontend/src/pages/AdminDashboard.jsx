import { useState ,useEffect} from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AdminDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar - Fixed at Top */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Scrollable Container for Sidebar & Main Content */}
      <div className="flex flex-1 pt-16">

        {/* Sidebar (Will Scroll with Main Content) */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Main Content (Will Scroll Together) */}
        <div className="flex-1 p-4 bg-gray-100 md:p-6">
          <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1>

          {/* Force extra content to enable scrolling */}
          <div style={{ height: "200vh", background: "#f8f9fa" }}>
            This content is here to enable scrolling.
          </div>
        </div>
    {/* <div className="flex flex-col min-h-screen">
      {/* Navbar at the top (not fixed) */}
      {/* <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main layout: Sidebar and Content in a row, items-stretch */}
      {/* <div className="flex items-stretch flex-1"> */}
        {/* Conditionally render Sidebar */}
        {/* {isSidebarOpen && <Sidebar isSidebarOpen={isSidebarOpen} />} */}

        {/* Main Content */}
        {/* <main className="flex-1 p-4 bg-gray-100"> */}
          {/* <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1> */}
          {/* Extra content to enable scrolling */}
          {/* <div style={{ height: "200vh", background: "#f8f9fa" }}> */}
            {/* This content is here to enable scrolling.<br /> */}
            {/* Notice the sidebar extends down the full height as well. */}
          {/* </div> */}
        {/* </main> */}
      {/* </div> */} 
    </div>
    </div>
  );
}

export default AdminDashboard;
