import React, { useEffect, useState } from "react";
import { BiChevronDown, BiChevronUp, BiX, BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import Select from 'react-select'
import { useSearchParams,NavLink } from 'react-router-dom';
import LoadingScreen from "../../Loading.jsx";
const AdvanceForm = () => {
  const[loading,setLoading]=useState(false)
  const [activeTab, setActiveTab] = useState("addadvance");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const[customer,setCustomer]=useState([])
  const[paymentType,setPaymentType]=useState({})
  const[FormData,setFormData]=useState({
      amount:0,
      customerName:null,
      date:"",
      paymentType:null,
      note:""    
  })
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
  const [searchParams] = useSearchParams();
  const id=searchParams.get("id")
  //Fetch customer
  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const response = await  axios.get('api/customer-data/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) // Replace with actual API URL
      
      // console.log("customer")
      // console.log(response.data)
      
        // Extract suppliers from API response
        const newCustomer = response.data.map((customer) => ({
          label: customer.customerName.toUpperCase(),
          value: customer._id,
        }))   
    
    setCustomer(newCustomer)
   } catch (err) {
      console.log(err.message);
    }
    finally{
      setLoading(false)
    }
    
  };

  //Fetch PAymentType
  const fetchPaymentType = async () => {
    try {
      setLoading(true)
      const response = await  axios.get('api/payment-types', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) // Replace with actual API URL
      // console.log("payment")
      // console.log(response.data)
        if(response.data.data){
          const newPAymentType= response.data.data.map((payment)=>({
            label:payment.paymentTypeName.toUpperCase(),
            value:payment._id
          }))
          setPaymentType(newPAymentType) 
          
        }

      
    } catch (err) {
      console.log(err.message);
    }
    finally{
      setLoading(false)
    }
  };


  
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await  axios.get('api/advance-payments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) // Replace with actual API URL
      
     
      const newadvance=response.data.data.find((item)=>item._id===id)
     
      setFormData(newadvance)
      console.log(new Date(newadvance.date).to)
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };
useEffect(()=>{
  if(id)
  fetchData()
},[id])
  
    
const updateData = async (id) => {
  setLoading(true)
      try {
        const response = await axios.put(
          `api/advance-payments/${id}`,
          FormData,
          {
            headers: {
              "Content-Type": "application/json", 
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Response:", response.data);
        alert(" Update Successfully");
      } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        alert("Unsuccessful: " + (err.response?.data?.message || err.message));
      }
      finally{
          setLoading(false)
      }
      
    };





  const sendAdvance = async () => {
    try {
      setLoading(true)
      const response = await  axios.post('api/advance-payments',FormData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) 
      
      alert("Advance added successfully")
     
    } catch (err) {
      console.log(err);
    }
    finally{
      setLoading(false)
    }
  };

  const handleChange= (e)=>{
    const {name,value}=e.target
   setFormData((prev)=>({
    
      ...prev,[name]:name==="amount"?Number(value):value
    
   }))
  }

  const handleSelectChange=(name)=>(selectedoption)=>{
    setFormData((prev)=>({
      
        ...prev,[name]:selectedoption.value || null 
    }))
  }
useEffect(()=>console.log(FormData),[FormData])
  
useEffect(()=>{fetchCustomer();
  fetchPaymentType();
},[])
  
  const handleSubmit = (e) => {
    e.preventDefault();
  console.log(FormData)
  if(id){
    updateData(id)
  }
  else
  sendAdvance()
 
  };
if(loading) return(<LoadingScreen/>)
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">




      
        <Sidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`flex-grow flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">New Advance</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Brand</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
              <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
              <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Customers List</a>
              <BiChevronRight className="hidden mx-1 sm:mx-2 sm:inline" />
              <NavLink to="/advance-lsti" className="text-gray-700 no-underline hover:text-cyan-600">
                Advance Payment List
              </NavLink>
              
            </nav>
          </header>

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("addadvance")}
                className={`py-2 px-4 font-semibold ${activeTab === "addadvance" ? "border-b-2 border-cyan-500 text-blue-500" : "text-gray-500"}`}
              >
                Add Advance
              </button>
            </div>
            <div className="mt-2">
              {activeTab === "addadvance" && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block font-medium text-gray-700 text-sm/6">Date <span className="text-red-500">*</span></label>
                    <input
  type="date"
  name="date"
  value={FormData.date ? new Date(FormData.date).toISOString().split("T")[0] : ""}
  onChange={handleChange}
  required
  className="w-full px-4 py-2 border rounded-md md:w-1/2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
/>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 text-sm/6">Customer Name <span className="text-red-500">*</span></label>
                    <div className="w-full ">
                    <Select
    className="w-full bg-white cursor-pointer md:w-1/2"
    options={customer}
    value={
      Array.isArray(customer)
        ? customer.find(
            (option) =>
              option.value === (FormData.customer?._id || FormData.customer || "")
          ) || null
        : null
    }
    onChange={handleSelectChange("customer")}
  />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 text-sm/6">Amount <span className="text-red-500">*</span></label>
                    <input type="number" min="0" name="amount" value={FormData.amount} onChange={handleChange} placeholder="Enter amount" required className="w-full px-4 py-2 border rounded-md md:w-1/2 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 text-sm/6">Payment Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                    <Select className="w-full bg-white cursor-pointer md:w-1/2" options={paymentType}  value={
      Array.isArray(paymentType)
        ? paymentType.find(
            (option) =>
              option.value === (FormData.paymentType?._id || FormData.paymentType || "")
          ) || null
        : null
    } onChange={handleSelectChange("paymentType")}/>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 text-sm/6">Additional Notes</label>
                    <textarea className="w-full px-4 py-2 border rounded-md md:w-1/2 focus:ring-2 focus:ring-blue-400 focus:outline-none"  placeholder="Enter additional details..."value={FormData.note} onChange={handleChange} name='note'></textarea>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button type="submit" className="px-12 py-2 font-medium text-white bg-green-500 hover:bg-green-600">{id?"Update":"Save"}</button>
                    <button type="button" className="px-12 py-2 font-medium text-white bg-yellow-500 hover:bg-yellow-600">Clear</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceForm;
