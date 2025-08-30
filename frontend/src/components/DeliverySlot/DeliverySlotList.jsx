
import React, { useState, useEffect } from 'react';
import { FaTachometerAlt ,FaEye} from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from "react-icons/fa";
import Select from 'react-select'

const DeliverySlotList = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 const[data,setData]=useState([])

 
    
  const [dropdownIndex, setDropdownIndex] = useState(null);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])

  
  const toggleDropdown = (id) => {
    setDropdownIndex(dropdownIndex === id ? null : id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/delivery/slot/all-slot', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("DAta")
      console.log(response)
      setData(response.data.data)
    } catch (err) {
      console.error("Error fetching delivery slot:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

 

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this ?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/delivery/slot/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Deleted Successfully");
    } catch (error) {
      console.error("Error deleting advance payment:", error.message);
    } finally {
      fetchData();
      setLoading(false);
    }
  };

 


  // Export functions (Copy, Excel, PDF, Print, CSV) remain unchanged...

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex">
        <div className="w-auto">
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex flex-col items-start justify-between p-0 mb-6 md:flex-row md:items-center">
            <h2 className="text-lg font-bold md:text-xl">Delivery Slot List</h2>
            <nav className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600 md:mt-0">
             <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/delivery-slot/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Delivery Slot List
                          </NavLink>    
            </nav>
          </header>
          {/* Filters Section */}
          <div className="p-4 mb-4 bg-white border-t-4 rounded shadow border-cyan-500">
            <div className="flex flex-col items-center justify-end mb-4 md:flex-row md:items-center">
              <button className="px-4 py-1 mt-2 text-white rounded bg-cyan-400 hover:bg-cyan-600 md:mt-0" onClick={() => navigate('/delivery-slot/create')}>
                + Create Delivery Slot
              </button>
            </div>

            
           

            {/* Advance Payments Table */}
          <div className="relative w-full overflow-x-auto ">
  <table className="w-full bg-white border-collapse rounded-md shadow-lg">
    <thead className="text-sm bg-gray-100">
      <tr>
        <th className="px-4 py-2 border">ID</th>
        <th className="px-4 py-2 border">Start Time</th>
        <th className="px-4 py-2 border">End Time</th>
        <th className="px-4 py-2 border">Fee</th>
        <th className="px-4 py-2 border">Action</th>
      </tr>
    </thead>
    <tbody>
      {data?.length === 0 ? (
        <tr>
          <td colSpan="5" className="py-4 text-sm text-center text-gray-500">
            No data available in table
          </td>
        </tr>
      ) : (
        data?.map((transfer) => (
          <tr key={transfer._id} className="transition-colors border-t hover:bg-gray-50">
            <td className="px-4 py-3 text-sm border">{transfer._id}</td>
            <td className="px-4 py-3 text-sm border">{transfer.startTime}</td>
            <td className="px-4 py-3 text-sm border">{transfer.endTime}</td>
            <td className="px-4 py-3 text-sm border">${transfer.fee}</td>
            <td className="relative px-4 py-3 text-sm border">
              <div className="flex justify-center">
                <button
                  className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white transition-colors rounded-md bg-cyan-600 hover:bg-cyan-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(transfer._id);
                  }}
                >
                  Actions
                  <span className="text-xs">▼</span>
                </button>
              </div>

              {dropdownIndex === transfer._id && (
                <div className="fixed z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg w-44 animate-fadeIn"
                
                >
                  <button
                    className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    onClick={() => handleDelete(transfer._id)}
                  >
                    <FaTrash className="text-xs" />
                    Delete
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
          </div>
        </div> 
      </div>
    </div>
  );
};


export default DeliverySlotList;