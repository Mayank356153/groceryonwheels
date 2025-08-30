import React from 'react'
import Select from 'react-select'
import { useState,useEffect } from 'react'
import axios, { all } from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from "../Navbar.jsx";
import AuditorSidebar from './AuditorSidebar.jsx'
import Button from '../contact/Button.jsx'
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from 'react-icons/fa'
import { CameraIcon } from '@heroicons/react/solid'
import { BrowserMultiFormatReader } from "@zxing/library";
import { useRef } from 'react'
import AuditorNavbar from './AuditorNavBar.jsx'
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const  UserBucketList=()=> {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [buckets,setBuckets]=useState([])

    useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  handleResize(); // Run on mount
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);


      const  navigate=useNavigate();

     const fetchData = async () => {
  try {
    const response = await  axios.get(`/api/audit/bucket/auditor/${localStorage.getItem("id")}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
      }
    })   
    console.log(response.data)
    setBuckets(response.data.data)
  } catch (err) {
    console.log(err.message);
  }
};
    
useEffect(()=>{
  fetchData()
},[])

 
  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete bucket")
    if(!conf){
      return ;
    }
  
   
    try {
      const response = await axios.delete(`/api/audit/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{

      fetchData()
    }
  };


  const handleSubmit=async(e)=>{
    e.preventDefault();
    const auditId=localStorage.getItem("auditId")
     const items={}
    const bucketformat = buckets.reduce((acc, bucket) => {
  const formatted = bucket.items.map(item => ({
    itemId: item.item_id._id,
    quantity: item.quantity
  }));
  return acc.concat(formatted);
}, []);


    bucketformat.forEach(item =>{
      items[item.itemId] = item.quantity
    })

    console.log(items)
 try {
    const response = await  axios.put(`/api/audit/bucket-submission`,{
      auditId:auditId,
      items
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
      }
    })   
    console.log(response)
    alert("Buckets submitted")
    for(const bucket of buckets){
       const response = await axios.delete(`/api/audit/${bucket._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    }
    fetchData();
  } catch (err) {
    alert("Unable to submit bucket")
    console.log(err);
  }
  }

    
     
     
  return (
    <div className="flex flex-col h-screen">
      <AuditorNavbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">

        <AuditorSidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`flex-grow flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Bucket List</h1>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/auditor-dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/bucket-list" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Bucket List
                          </NavLink>    
                          <NavLink to="/bucket-create" className="text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Add Bucket
                          </NavLink>
              
            </nav>
          </header>

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
             <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="hidden bg-gray-50 md:table-header-group">
      <tr>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
          Bucket ID
        </th>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
          Total Items
        </th>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {/* Sample data - replace with your actual data */}
      {buckets.map((bucket) => (
        <tr key={bucket._id} className="hidden hover:bg-gray-50 md:table-row">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{bucket._id}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-500">{bucket.items.length}</div>
          </td>
          <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/bucket-create?id=${bucket._id}`)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <span className="hidden md:inline">Update</span>
                <FiEdit className="inline md:hidden" />
              </button>
              <button
                onClick={() => handleDelete(bucket._id)}
                className="text-red-600 hover:text-red-900"
              >
                <span className="hidden md:inline">Delete</span>
                <FiTrash2 className="inline md:hidden" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  
  {/* Mobile-friendly card view that appears on small screens */}
  <div className="bg-white md:hidden">
    {buckets.map((bucket) => (
      <div key={bucket._id} className="p-4 border-b border-gray-200">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Bucket ID</p>
            <p className="text-sm text-gray-500">{bucket._id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Total Items</p>
            <p className="text-sm text-gray-500">{bucket.items.length}</p>
          </div>
        </div>
        <div className="flex justify-end mt-2 space-x-2">
          <button
                onClick={() => navigate(`/bucket-create?id=${bucket._id}`)}
            className="p-1 text-indigo-600 hover:text-indigo-900"
          >
            <FiEdit />
          </button>
          <button
                onClick={() => handleDelete(bucket._id)}
            className="p-1 text-red-600 hover:text-red-900"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    ))} 
  </div>
</div>
               
 

                       
         
                
                 
            </div>



            
             <div className='flex flex-col items-center justify-around w-full gap-2 mx-auto mt-4 sm:flex-row'>
                                                                  <Button className="w-full text-white bg-green-500 rounded cursor-pointer hover:bg-green-600" type='submit' text={"Submit"} onClick={handleSubmit}/> {/* Save button */}
                                                                  <Button className="w-full text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600" text="Reset" />  {/* Close button  */}
                                   </div> 
            
          </div>
        </div>
      </div>
  )
}

export default UserBucketList
