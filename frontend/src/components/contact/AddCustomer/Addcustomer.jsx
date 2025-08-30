
import React,{useState,useEffect} from 'react';
import Edit from './Edit'; // Importing the Edit component
import Advanced from './Advanced'; // Importing the Advanced component
import '@fortawesome/fontawesome-free/css/all.min.css'; // Importing Font Awesome for icons
import Navbar from '../../Navbar'; // Importing the Navbar component
import Sidebar from '../../Sidebar'; // Importing the Sidebar component
import { NavLink } from 'react-router-dom'; // Importing NavLink for navigation
import {FaTachometerAlt} from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';
import LoadingScreen from '../../../Loading';
import axios from 'axios';
export default function Addcustomer() {
  // State to manage the active tab (Edit or Advanced)
  const[activeTab,setActiveTab]=useState("Edit");
  // State to manage the sidebar open/close status
  const[isSidebarOpen,setSidebarOpen]=useState(true);
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
      const [searchParams] = useSearchParams();
      const id=searchParams.get("id")
      const[loading,setLoading]=useState(false)
    const [formData, setFormData] = useState({
      customerName: '',
      mobile: '',
    type:"Online",

      
      // address
      city:"",
        state:"",
        postcode:"",
        locationLink:"",
        country:"",
        area:"",

        //country
        
      shippingcountry:"",
      shippingCity:"",
      shippingArea:"",
      shippingState:"",
      shippingPostcode:"",
      shippingLocationLink:"",


        
        attachmentPath: "",
        creditLimit: 0,
        customerImage:"",
        customerId:'',
        email: '',
        gstNumber: '',
        openingBalancePayments:[],
         panNumber:"",
         phone:"",
         previousDue:0,
         priceLevel:0,
         priceLevelType:"",
         salesReturnDue:0,
         taxNumber:""
    });
    const [p,setP]=useState(0)
    const [l,setL]=useState("")
      const fetchData = async () => {
        setLoading(true)
        try {
          const response = await  axios.get(`/api/customer-data/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          
          console.log(response.data)
          const data=response.data.find((item)=>item._id===id)
          console.log(data)
          setFormData(data)
          setP(data.priceLevel)
          setL(data.priceLevelType)
        } catch (err) {
          console.log(err.message);
        } finally {
          setLoading(false);
        }
      };
    useEffect(()=>{
        if(id){
            fetchData();
        }
    },[id])
        
    if(loading) return(<LoadingScreen/>)
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
            <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-200"> 
              {/* Header section with navigation links for tabs */}
              <div className="flex items-center">
                {/* Navigation link for the Edit component */}
                <button
                  onClick={()=>setActiveTab("Edit")} // Set active tab to Edit
                  className={`py-2 px-4 font-semibold ${
                    activeTab === "Edit"
                      ? "border-b-2 border-blue-500 text-blue-500" // Active tab styling
                      : "text-gray-500" // Inactive tab styling
                  }`}
                > 
                  <i className="mr-2 fas fa-edit"></i> {/* Font Awesome icon for edit */}
                  Add/Edit 
                </button>
              </div>
              <div className="flex items-center">
                {/* Navigation link for the Advanced component */}
                <button 
                  onClick={()=>setActiveTab("Advanced")} // Set active tab to Advanced
                  className={`py-2 px-4 font-semibold ${
                    activeTab === "Advanced"
                      ? "border-b-2 border-blue-500 text-blue-500" // Active tab styling
                      : "text-gray-500" // Inactive tab styling
                  }`}
                >
                  <i className="mr-2 fas fa-cog"></i> {/* Font Awesome icon for advanced settings */}
                  Advanced
                </button>
              </div>
            </div>
            {/* Conditionally render the Edit or Advanced component based on the active tab */}
            {activeTab === "Edit" && <Edit formData={formData} setFormData={setFormData} setActiveTab={setActiveTab} id={id}/>} 
            {activeTab === "Advanced" && <Advanced formData={formData} setFormData={setFormData} setActiveTab={setActiveTab} id={id} p={p} l={l} />}
          </div>
        </div>
        
      </div>
    </div>
  );
}
