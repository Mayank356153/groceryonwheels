import { useState } from "react";
import { Transition } from '@headlessui/react';

import {
  FaHome,
  FaAddressBook,
  FaUserPlus,
  FaUsers,
  FaStore,
  FaAngleDown,
  FaAngleUp,
  FaTags,
  FaDollarSign,
  FaCalendarPlus,
  FaCube,
  FaCubes,
  FaHourglassEnd,
  FaThLarge,
  FaTachometerAlt,
  FaTag,FaClipboardList,
  FaEnvelope,
  FaChartBar,
  FaCogs,
  FaList,
  FaUserShield,
  FaCartPlus, 
  FaCashRegister, 
  FaPlusCircle, 
  FaListAlt, 
  FaMoneyBillWave, 
  FaUndoAlt ,
  FaShoppingBag,
  FaTicketAlt,
  FaBullhorn,
  FaFolderOpen,FaListUl,FaFileInvoice,FaUndo,
  FaPiggyBank,FaExchangeAlt,FaFileImport,FaPrint,
  FaShapes,FaLayerGroup,FaTools,FaPlusSquare,
  FaFileAlt,FaPaperPlane,FaWarehouse,FaKey,FaCreditCard,
  FaBalanceScale,FaPercentage,FaSms,FaQuestionCircle,
  
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AuditorSidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const [dropdowns, setDropdowns] = useState({
    
    help:false,
    helps:false,
    audit:false
  });



  
  const handleDropdownToggle = (section) => {
    setDropdowns((prev) => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = key === section ? !prev[key] : false;
      });
      return updated;
    });
  };
  
  
  const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
  const isAdmin = userRole === "admin";


  if (!isSidebarOpen) return null;

  return (
    <div className="absolute md:relative w-64 overflow-y-auto text-white bg-gray-900 z-[999] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-200 min-h-screen ">

{/* Header without extra margin */}
      <div
        className="flex items-center p-3 cursor-pointer hover:bg-gray-700"
        onClick={() => navigate("/auditor-dashboard")}
      >
        <FaHome />
        <span>Dashboard</span>
      </div>

      {/* Sidebar Menu Items */}
      <ul className="space-y-2">
      



         

        
        
{/* Audit feature */}
    
  
   
    

          
        
         <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/bucket-create")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Create Bucket</span>
          </li>
         <li
            className="flex items-center p-2 space-x-2 text-sm cursor-pointer hover:bg-gray-700"
            onClick={() => navigate("/bucket-list")}
          >
            <FaPlusSquare /> {/* Changed from FaCashRegister */}
            <span>Bucket List</span>
          </li>
        
      
    
   




        {/* Help Dropdown */}
    
          
        
                  <li
                    className="flex items-center p-2 text-sm cursor-pointer hover:bg-gray-700"
                    onClick={() => window.location.href = "https://pos.agribioj.com/help/"}
                    >
                    <FaQuestionCircle />
                    <span>Help Center</span>
                  </li>
                
            
      </ul>
    </div>
  );
};

export default AuditorSidebar;
