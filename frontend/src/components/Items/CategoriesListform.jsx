import React, { useState,useEffect } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';
import axios from "axios";
import LoadingScreen from "../../Loading";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
const BrandForm = () => {
  const[loading,setLoading]=useState(false)
  const Navigate=useNavigate()
  const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [searchParams] = useSearchParams();
   const id=searchParams.get("id")
 const[formData,setFormData]=useState({
  name:"",
  description:"",
  subCategories:[]
 })
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
 const fetchCategory = async () => {
  setLoading(true)
  try {
    const response = await axios.get('api/categories', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    });

  console.log(response.data)
   const updateCategory=response.data.find((item)=>item._id===id)
   setFormData(updateCategory)
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
    //send data to api
    const postData = async () => {
      try {
        console.log("Sending FormData:", formData);
        const response = await axios.post(
          "api/categories",
          formData,
          {
            headers: {
              "Content-Type": "application/json", // Change Content-Type
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
    
        console.log("Response:", response.data);
        alert("Category Added Successfully");
      } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        alert("Unsuccessful: " + (err.response?.data?.message || err.message));
      }
    };
          
const updateData = async () => {
  setLoading(true)
      try {
        const response = await axios.put(
          `api/categories/${id}`,
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
          Navigate('/categories-list')
      }
      
    };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(id) updateData()
     else postData();
    setFormData({
      name:"",
      description:"",
      status:"Active",
      subCategories:[]
    }) 
    
  };
if(loading) return(<LoadingScreen/>)
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col ">
        {/* Sidebar */}
        <div className="w-auto">
        <Sidebar isSidebarOpen={isSidebarOpen} />
          
        </div>

        {/* Content */}
        <div className={`w-full overflow-x-auto p-4  transition-all duration-300 bg-gray-100`}>
          <div className="w-full ">
            <div className="w-full">
                 {/* Header Section */}
                       <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
                       
                            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                                <h1 className="text-lg font-semibold truncate sm:text-xl">Category</h1>
                                <span className="text-xs text-gray-600 sm:text-sm">Add/Update Category</span>
                              </div>
                         <nav className="flex flex-wrap mt-2 text-sm text-gray-600">
                         <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt /> Home </NavLink>
                         <NavLink to="/categories-list" className="items-center text-gray-700 no-underline tflex">&gt;Category List</NavLink>
                           
                          
                         </nav>
                       </header>
              <form onSubmit={handleSubmit} className="p-2 border-t-4 rounded shadow border-cyan-500" >
                <p className="mb-3 text-lg font-medium text-gray-700">Please Enter Valid Data</p>

                <div className="flex gap-2 mb-4">
                  <label className="block font-semibold text-gray-700">
                    Category Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
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
