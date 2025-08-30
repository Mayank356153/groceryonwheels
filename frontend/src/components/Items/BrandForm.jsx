import React, { useState,useEffect } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios from "axios";
import LoadingScreen from "../../Loading";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from 'react-router-dom';
const BrandForm = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
const[loading,setLoading]=useState(false)
  const Navigate=useNavigate()
    const [searchParams] = useSearchParams();
     const id=searchParams.get("id")
   const[formData,setFormData]=useState({
    brandName:"",
    description:"",
   })
    useEffect(()=>{
       if(window.innerWidth < 768){
         setSidebarOpen(false)
       }
     },[])
 const fetchCategory = async () => {
  setLoading(true)
  try {
    const response = await axios.get('api/brands', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    });

  console.log(response.data)
   const updateBrand=response.data.data.find((item)=>item._id===id)
   setFormData(updateBrand)
  } catch (err) {
    console.log(err.message);
  } finally {
    setLoading(false);
  }
};
useEffect(()=>{
  if(id)
  fetchCategory()
},[id])


const handleChange=(e)=>{
  const {name,value}=e.target
  setFormData((prev)=>({...prev,[name]:value}))
}
const postData = async () => {
  try {
    console.log("Sending FormData:", formData);
    const response = await axios.post(
      "api/brands",
      formData,
      {
        headers: {
          "Content-Type": "application/json", // Change Content-Type
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    console.log("Response:", response.data);
    alert("Brand Added Successfully");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    alert("Unsuccessful: " + (err.response?.data?.message || err.message));
  }
};

         
const updateData = async () => {
  setLoading(true)
      try {
        const response = await axios.put(
          `api/brands/${id}`,
          formData,
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
          Navigate('/brand-list')
      }
      
    };


  const handleSubmit = (e) => {
    e.preventDefault();
    if(id) updateData()
      else postData();
     setFormData({
       brandName:"",
       description:"",
     }) 
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-grow md:flex-row">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Content */}
        <div className={`flex-grow p-4  transition-all duration-30 bg-gray-100`}>
          <div className="w-full mt-14">
            <div className="w-full">
                 {/* Header Section */}
                       <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
                       
                            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                                <h1 className="text-lg font-semibold truncate sm:text-xl">Brand</h1>
                                <span className="text-xs text-gray-600 sm:text-sm">Add/Update Brand</span>
                              </div>
                         <nav className="flex flex-wrap mt-2 text-sm text-gray-600">
                           <a
                             href="/dashboard"
                             className="flex items-center text-gray-400 no-underline hover:text-cyan-600"
                           >
                             <FaTachometerAlt className="mr-2 text-gray-500" /> Home
                           </a>
                           <BiChevronRight className=" text-gray-400 mt-1.5" />
                           <a href="/brands-list" className="text-gray-400 no-underline hover:text-cyan-600">
                           Brand List
                           </a>
                           <BiChevronRight className=" text-gray-400 mt-1.5" />
                           <a href="#" className="text-gray-400 no-underline hover:text-cyan-600">
                           Brand
                           </a>
                         </nav>
                       </header>
              <form onSubmit={handleSubmit} className="p-2 border-t-4 rounded shadow border-cyan-500" >
                <p className="mb-3 text-lg font-medium text-gray-700">Please Enter Valid Data</p>

                <div className="flex gap-2 mb-2">
                  <label className="block font-semibold text-gray-700">
                    Brand Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={handleChange}
                    name="brandName"
                    className="w-full px-2 py-1 mt-1 border border-gray-300 rounded md:w-1/2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-3 mb-2">
                  <label className="block font-semibold text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    name="description"
                    onChange={handleChange}
                    className="w-full px-2 py-1 mt-1 border border-gray-300 rounded md:w-1/2 focus:ring-2 focus:ring-blue-400 focus:outline-none h-14"
                    rows="3"
                  ></textarea>
                </div>

                <div className="flex justify-center gap-2 mt-6">
                  <button type="submit" className="px-12 py-2 text-white bg-green-500 hover:bg-green-600">
                    {id?"Update":"Save"}
                  </button>
                  <button type="button" className="px-12 py-2 text-white bg-orange-500 hover:bg-orange-600">
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandForm;
