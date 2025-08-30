import React, { useState,useEffect } from "react";

import { generatePath, Link } from "react-router-dom";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import { FaTachometerAlt,FaTimes,FaSyncAlt,FaPlusCircle } from "react-icons/fa";
import Select from 'react-select'
import LoadingScreen from "../../Loading.jsx";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const CouponForm = () => {
  const Navigate=useNavigate()
    const[customers,setCustomers]=useState([])
    const[discountCoupon,setDiscontCoupon]=useState([])
    const [isSidebarOpen, setSidebarOpen] = useState(true);
   const[loading,setLoading]=useState(false)
   const [searchParams] = useSearchParams();
      const couponid=searchParams.get("couponid")
      const customerid=searchParams.get("customerid")
       const[items,setItems]=useState([])
       const[categories,setCategories]=useState([])
       const[subcategories,setSubCategories]=useState([])
       const[subsubcategories,setSubSubCategories]=useState([])
     const[formData,setFormData]=useState({
       customer:null,
       discountCoupon:null,
       couponCode:"",
       occasionName:"",
       expiryDate:"",
       value:0,
       minCartValue:0,
       allowedTimes:1,
        usedTimes:0,
       couponType:"",
        description:"",
        // status: "Active",
        itemsAllowed: [],
        categoryAllowed: [],  
        subCategoryAllowed: [],
        subsubCategoryAllowed: [],
     })
        
     
   const couponType=[{
    label:"Percentage(%)",
    value:"Percentage",
   },
  {
    label:"Fixed",
    value:"Fixed"
  }]

 function generateCouponCode(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        coupon += characters[randomIndex];
    }
    return coupon;
}
  //gnerate coupon code
  useEffect(()=>{
    function generateCouponCode(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        coupon += characters[randomIndex];
    }
    return coupon;
}
setFormData((prev)=>({
  ...prev,
  couponCode: generateCouponCode(10), 
}))
  },[])

  
      useEffect(()=>{
         if(window.innerWidth < 768){
           setSidebarOpen(false)
         }
       },[])

       
    const fetchDiscountCoupons = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/discount-coupons', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
          console.log(response.data)
          if(response.data){
            const newcoupon=response.data.map((coupon)=>({
                label:coupon.couponCode,
                value:coupon._id
            }))
            setDiscontCoupon(newcoupon)
          } 
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };

     
      const fetchCustomerCoupons = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/customer-coupons', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
          console.log(response.data) 
          // if(!couponid) return;
          const updatecoupon=response.data.find((item)=>item._id===couponid)
          console.log(updatecoupon)
          setFormData(updatecoupon)
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };

 const fetchItems = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/items', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
         
          const newformat=response.data.data.map((item)=>({
            label:item.itemName,
            value:item._id
          }))
          setItems(newformat)
          // if(!couponid) return;
        
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };

       const fetchCategories = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/categories', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
         
          const newformat=response.data.data.map((item)=>({
            label:item.name,
            value:item._id
          }))
          setCategories(newformat)
          // if(!couponid) return;
        
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };

       const fetchSubCategories = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/subcategories', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
          console.log("JHg")
          console.log(response.data) 
          const newformat=response.data.data.map((item)=>({
            label:item.name,
            value:item._id
          }))
          setSubCategories(newformat)
          // if(!couponid) return;
        
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };

        const fetchSubSubCategories = async () => {
        try {
          setLoading(true)
          const response = await  axios.get('api/sub-subcategories', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) 
          console.log("JHg")
          console.log(response.data) 
          const newformat=response.data.data.map((item)=>({
            label:item.name,
            value:item._id
          }))
          setSubSubCategories(newformat)
          // if(!couponid) return;
        
        } catch (err) {
          console.log(err.message);
        }
        finally{
          setLoading(false)
        }
      };
      

      
      const sendCustomerCoupon = async () => {
        try {
          setLoading(true)
          console.log(formData)
          const response = await  axios.post('api/customer-coupons/create',formData, {
            headers: {
              "Content-Type":"application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          console.log(response)
          alert("Added successfully")
         setFormData({
             customer:null,
       discountCoupon:null,
       couponCode:generateCouponCode(10), // Generate a new coupon code 
       occasionName:"",
       expiryDate:"",
       value:0,
       minCartValue:0,
       allowedTimes:1,
        usedTimes:0,
       couponType:"",
        description:"",
        // status: "Active",
        itemsAllowed: [],
        categoryAllowed: [],  
        subCategoryAllowed: [],
        subsubCategoryAllowed: [],
          })
        } catch (err) {
          alert("Unable to add coupon")
          console.log(err.message);
        } 
        finally{
          setLoading(false)
          
        }
      };

       
      const updateCoupon = async () => {
        try {
          setLoading(true)
          console.log(formData)
          const response = await  axios.put(`api/customer-coupons/${couponid}`,formData, {
            headers: {
              "Content-Type":"application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
            }
          }) // Replace with actual API URL
          
         
        } catch (err) {
          alert("Unable to update coupon")
          console.log(err.message);
        } 
        finally{
          setLoading(false)
         Navigate('/customer-coupen-list')
        }
      };
      


      const fetchCustomers=async()=>{
        try {
          setLoading(true)
            const response = await  axios.get('api/customer-data/all', {
              headers: {
                "Content-Type":"application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
              }
            }) // Replace with actual API URL
            
            //   console.log(response.data)   
              if(response.data){
                const newcustomers=response.data.map((item)=>({
                    label:item.customerName,
                    value:item._id
                }))
                setCustomers(newcustomers)
              }       
          } catch (err) {
            console.log(err.message);
          } 
          finally{
            setLoading(false) 
          }
      }
      
    useEffect(()=>{
    
         fetchCustomers();
        fetchDiscountCoupons();
       fetchItems();
       fetchCategories();
       fetchSubCategories();
        fetchSubSubCategories();  
        if(couponid){
          fetchCustomerCoupons()
        }
      
      
    },[])
   
    const handleChange=(e)=>{
        const{name,value}=e.target
        setFormData((prev)=>({
            ...prev,
            [name]:e.target.type=="number"?Number(value):value
          }))    
        }
    const handleSubmit=(e)=>{
        e.preventDefault();
        if(couponid){
          updateCoupon();
          return;
        }
       sendCustomerCoupon();
    }
   if(loading) return <LoadingScreen/>
  
    return (
  <div className="flex flex-col h-screen">
    {/* Navbar */}
    <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
    {/* Main Content */}
    <div className="flex flex-grow">
      {/* Sidebar */}
      <div>
        
      <Sidebar isSidebarOpen={isSidebarOpen} />
      </div>
      {/* Content */}
      <div
        className={`flex flex-col p-4 min-h-screen transition-all duration-300 w-full`}
      >
        <header className="flex flex-col items-center justify-between h-auto p-4 mb-6 bg-gray-100 rounded-lg shadow-md md:flex-row">
          <h1 className="text-2xl font-semibold">Add <span className="text-sm text-gray-500">/Update Coupon</span></h1>
          <div className="flex items-center space-x-2 text-blue-600">
            <Link to="/" className="flex items-center text-sm text-gray-500 no-underline hover:text-cyan-600">
              <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
            </Link>
            <span className="text-gray-400">{">"}</span>
            <Link to="/coupons" className="text-sm text-gray-500 no-underline hover:text-cyan-600"> Coupons List </Link>
          </div>
        </header>
        
        <form className="flex flex-col px-2 bg-white border-t-4 rounded-lg shadow-md border-cyan-500" onSubmit={handleSubmit}>
          

          <div className="flex flex-col w-full mt-2 space-y-3 md:flex-row">

            
            {/* Customer Selection */}
             <div className="flex flex-col w-full ">
            <label className="w-full text-sm font-medium md:w-1/3">Customer Name <span className="text-red-300">*</span></label>
            <div className="w-full md:w-2/3">
              <Select 
                options={customers} 
                onChange={(selectedOption) => 
                  setFormData(prev => ({ ...prev, customer: selectedOption.value }))
                }  
                value={customers?.find(option => option.value === (formData?.customer?._id || formData?.customer)) || null} 
              />
            </div>
          </div>
       
             {/* Discount Coupon */}
          <div className="flex flex-col w-full ">
            <label className="w-full text-sm font-medium md:w-1/3">Discount Coupon <span className="text-red-300">*</span></label>
            <div className="w-full md:w-2/3">
              <Select 
                options={discountCoupon} 
                onChange={(selectedOption) => setFormData(prev => ({ ...prev, discountCoupon: selectedOption.value }))}  
                value={discountCoupon?.find(option => option.value === (formData.discountCoupon?._id || formData.discountCoupon || "")) || null}
              />
            </div>
          </div>

           <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Coupon Code <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="couponCode" 
              value={formData.couponCode} 
              onChange={handleChange} 
              placeholder="Enter Coupon Code" 
            />
          </div>
          
          </div>
       
          <div className="flex flex-col justify-around w-full mt-2 space-y-3 md:flex-row">
           
             
         

          {/* NEW: Minimum Cart Value */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Minimum Cart Value</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="minCartValue" 
              value={formData.minCartValue} 
              onChange={handleChange} 
              min="0" 
              placeholder="Minimum order amount to apply coupon" 
            />
          </div>
          
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Usage Limit</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="allowedTimes" 
              value={formData.allowedTimes} 
              onChange={handleChange} 
              min="1" 
              placeholder="How many times this coupon can be used" 
            />
          </div>

          {/* Expiry Date */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Expiry Date</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="expiryDate" 
              value={formData.expiryDate} 
              onChange={handleChange} 
            />
          </div>
          
          </div>










          <div className="flex flex-col justify-around w-full mt-2 space-y-3 md:flex-row">
            {/* Coupon Value */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Coupon Value</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="value" 
              value={formData.value} 
              onChange={handleChange} 
              min="0" 
              placeholder="Enter Coupon Value" 
            />
          </div>

          {/* Coupon Type */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Coupon Type</label>
            <Select 
              options={couponType} 
              onChange={(selectedOption) => setFormData(prev => ({ ...prev, couponType: selectedOption.value }))}  
              className="w-full md:w-2/3"
              value={couponType?.find(option => option.value === (formData.couponType || "")) || null}
            />
          </div>

          {/* NEW: Applicable Items */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Applicable Items</label>
            <Select
              isMulti
              options={items}
              onChange={(selectedOptions) => 
                setFormData(prev => ({ 
                  ...prev, 
                 itemsAllowed : selectedOptions.map(option => option.value) 
                }))
              }
              value={items?.filter(option => 
                formData.itemsAllowed?.includes(option.value)
              ) || []}
              className="w-full md:w-2/3"
              placeholder="Select items this coupon applies to"
            />
          </div>

         
         
          </div>

          {/* ss */}
          
          <div className="flex flex-col justify-around w-full mt-2 space-y-3 md:flex-row">
         

 <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Applicable Categories</label>
            <Select
              isMulti
              options={categories}
              onChange={(selectedOptions) => 
                setFormData(prev => ({ 
                  ...prev, 
                  categoryAllowed: selectedOptions.map(option => option.value) 
                }))
              }
              value={categories?.filter(option => 
                formData.categoryAllowed?.includes(option.value)
              ) || []}
              className="w-full md:w-2/3"
              placeholder="Select categories "
            />
          </div>

          
          {/* NEW: Applicable Subcategories */}
          <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Applicable Subcategories</label>
            <Select
              isMulti
              options={subcategories}
              onChange={(selectedOptions) => 
                setFormData(prev => ({ 
                  ...prev, 
                   subCategoryAllowed: selectedOptions.map(option => option.value) 
                }))
              }
              value={subcategories?.filter(option => 
                formData.subCategoryAllowed?.includes(option.value)
              ) || []}
              className="w-full md:w-2/3"
              placeholder="Select subcategories "
            />
          </div>

          {/* Occasion Name */}
         

        
         <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium ">Applicable Subsubcategories</label>
            <Select
              isMulti
              options={subsubcategories}
              onChange={(selectedOptions) => 
                setFormData(prev => ({ 
                  ...prev, 
                  subsubCategoryAllowed: selectedOptions.map(option => option.value) 
                }))
              }
              value={subsubcategories?.filter(option => 
                formData.subsubCategoryAllowed?.includes(option.value)
              ) || []}
              className="w-full md:w-2/3"
              placeholder="Select subsubcategories "
            />
          </div>


          </div>
  {/* Description */}


  <div className="flex flex-col justify-around w-full mt-2 space-y-3 md:flex-row">
    
           <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Occasion Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              name="occasionName" 
              value={formData.occasionName} 
              onChange={handleChange} 
              placeholder="Enter Occasion Name" 
            />
          </div>
        
     <div className="flex flex-col w-full">
            <label className="w-full text-sm font-medium md:w-1/3">Description</label>
            <textarea 
              className="w-full p-2 border rounded md:w-2/3 focus:ring" 
              placeholder="Enter Description" 
              value={formData.description} 
              name="description" 
              onChange={handleChange}
            ></textarea>
          </div>

          
            <div className="flex flex-col w-full">
           
          </div>
          
        
  </div>
         

       
         

      
         

          {/* Form Actions */}
         <div className="flex w-full gap-4 py-4 mt-6">
  <button
    type="submit"
    className="px-6 py-2.5 font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 w-full"
  >
    <span className="flex items-center justify-center gap-2">
      {couponid ? (
        <>
          <FaSyncAlt className="text-sm" />
          Update
        </>
      ) : (
        <>
          <FaPlusCircle />
          Create
        </>
      )}
    </span>
  </button>
  
  <button
    type="button"
    className="px-6 py-2.5 font-medium text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50 w-full"
  >
    <span className="flex items-center justify-center gap-2">
      <FaTimes />
      Close
    </span>
  </button>
</div>
        </form>
      </div>
    </div>
  </div>
);
  


  };

export default CouponForm;