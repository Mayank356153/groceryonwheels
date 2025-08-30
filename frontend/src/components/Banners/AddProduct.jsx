import React from 'react'
import { useState, useRef, useEffect } from 'react'
import Navbar from '../Navbar.jsx'
import Sidebar from '../Sidebar.jsx'
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from "react-icons/fa";
import PreviewGallery from './ProductImagePreview.jsx'
import axios from 'axios'
import LoadingScreen from '../../Loading.jsx'
import Select from 'react-select'



export default function AddProduct() {
  const link="https://pos.inspiredgrow.in/vps"
    const[isSidebarOpen,setSidebarOpen]=useState(true)
    
    function generateNewProductId(oldProductId) {
      
      if(!oldProductId) return "PROD/2025/12"
  const parts = oldProductId.split('/');
  
  if (parts.length !== 3 || parts[0] !== 'PROD') {
    throw new Error('Invalid product ID format. Expected format: PROD/YYYY/NN');
  }

  const year = parts[1];
  const number = parseInt(parts[2], 10);

  if (isNaN(number)) {
    throw new Error('Invalid number part in product ID');
  }

  const newNumber = number + 1;
  return `PROD/${year}/${newNumber}`;
}


    const[formData,setFormData]=useState({
      ProductId :"",
      description:"",
      media:[],
      previousMedia:[],
      brands:[]
    })
    const[loading,setLoading]=useState(false)
    const[view,setView]=useState(false)
  const[preview,setPreview]=useState([])
  const [brands,setBrands]=useState([])
  
  
    const addFile=async(e)=>{
      const file = e.target.files[0];

      if (file) {
        const url = URL.createObjectURL(file);
   
        setPreview((prev)=>[...prev,{
          url:url,
          path:file.name,
        }]);
      
        setFormData((prev)=>({...prev,media:[...prev.media,e.target.files[0]]}))
      } else {
        alert("Please select an image file.");
      }
    }
    
useEffect(()=>console.log(formData),[formData])
useEffect(()=>console.log(preview),[preview])
    
const handleSubmit = async () => {
  const formDataToSend = new FormData();
  formDataToSend.append("ProductId", formData.ProductId);
  formDataToSend.append("description", formData.description);
  formDataToSend.append("brands", JSON.stringify(formData.brands.map(brand => brand.value))); // Assuming brands is an array of objects with a 'value' property
  formData.media.forEach((file) => {
    formDataToSend.append("media", file); // "media" should match multer field
  });
  console.log("Form Data to Send:", formDataToSend);
  console.log("Form Data:", formData);
  try {
    setLoading(true)
    const response = await axios.post(
      `api/product/add`,
      formDataToSend
    );
    alert("created successfully")
    console.log("Success:", response.data);
    setFormData({
        ProductId :generateNewProductId(response.response.productId),
      description:"",
      media:[],
      previousMedia:[],
      brands:[]
    })
    setPreview([])
  } catch (error) {
    console.error("Error fetching item code:", error);
  }
  finally{
    setLoading(false)
  }
};

useEffect(()=>{
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`api/product/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log(response.data)
     if(response.data){
      const last=response.data[response.data.length-1]
      console.log("K",last)
      setFormData((prev)=>({
        ...prev,
        ProductId :generateNewProductId(last.productId) 
      }))
     
     }
    } catch (err) {
      console.error("Error fetching advance payments:", err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchBrands=async()=>{
     try {
      setLoading(true);
      const response = await axios.get(`api/brands`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("brands ")
      console.log(response.data)
      const brand =response.data.data.map( item => ({
        label: item.brandName,
        value:item._id
      })
    )
       setBrands(brand)
    } catch (err) {
      console.error("Error fetching advance payments:", err.message);
    } finally {
      setLoading(false);
    }
  }
  fetchBrands();
  fetchData();
},[])

   
  // return (
  //   <div className="flex flex-col h-screen">
  //     <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
  //     <div className="flex flex-grow ">

  //       <Sidebar isSidebarOpen={isSidebarOpen} />
          
  //          {/* Content */}
  //        <div className={`flex-grow flex flex-col p-2 md:p-2  `}>
  //         <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
  //           <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
  //             <h1 className="text-lg font-semibold truncate sm:text-xl">New Product</h1>
  //             <span  className="text-xs text-gray-600 sm:text-sm">Add/Update Product</span>
  //           </div>
  //           <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
  //  <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
  //                           <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
  //                         </NavLink>     
  //                         <NavLink to="/banners/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
  //                          &gt; Product List
  //                         </NavLink>    
  //                         <NavLink to="/product/add" className="text-gray-700 no-underline hover:text-cyan-600">
  //                          &gt; Add Product
  //                         </NavLink>
              
  //           </nav>
  //         </header>
  //        {view && <PreviewGallery previewUrls={preview} setView={setView} view={view} formData={formData} setFormData={setFormData}/>}
  //         <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
  //           <div className='flex w-full gap-2'>
  //               <div className='flex flex-col w-full'>
  //                   <label htmlFor="">Product Id</label>
  //                   <input type="text" readOnly name="" id="" className='w-full px-2 py-1 border-2 rounded-md'/>
  //               </div>
  //               <div className='flex flex-col w-full'>
  //                   <label htmlFor="">description</label>
  //                   <input type="text"  value={formData.description} onChange={(e)=>setFormData((prev)=>({...prev,description:e.target.value}))} id="" className='w-full px-2 py-1 border-2 rounded-md'/>
  //               </div>
  //           </div>
  //           <div className='flex flex-col w-full mt-4'>
  //               <label htmlFor="">Media</label>
  //           <input type="file" onChange={addFile} name="" id="" className='w-full px-2 py-1 border-2 rounded-md'/>
  //           </div>
            
  //           <button
  //         onClick={() => setView(true)}
  //         className="absolute top-0 left-0 z-50 px-3 py-1 mt-2 ml-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
  //       >
  //         📷 View Gallery
  //       </button>
                  
                 
          
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  // )
  if(loading){
    return <LoadingScreen/>
  }
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
  
        {/* Main Content */}
        <div className="relative flex flex-col flex-grow p-2 md:p-2">
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">New Product</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Product</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </NavLink>
              <NavLink to="/product/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                &gt; Product List
              </NavLink>
              <NavLink to="/product/add" className="text-gray-700 no-underline hover:text-cyan-600">
                &gt; Add Product
              </NavLink>
            </nav>
          </header>
  
          {/* View Gallery Button */}
         
  
          {/* Preview Gallery */}
          {view && (
            <PreviewGallery
              previewUrls={preview}
              setPreviewUrls={setPreview}
              setView={setView}
              view={view}
              formData={formData}
              setFormData={setFormData}
            />
          )}
  
          {/* Form Section */}
          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            <div className="flex w-full gap-2">
              <div className="flex flex-col w-full">
                <label>Product Id</label>
                <input type="text" readOnly className="w-full px-2 py-1 border-2 rounded-md" value={formData.ProductId}/>
              </div>
              <div className="flex flex-col w-full">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-2 py-1 border-2 rounded-md"
                />
              </div>
            </div>
  

            <div className="flex flex-col w-full mt-4">
              <label>Category</label>
              <Select className='w-1/2' options={brands} isMulti value={formData.brands} onChange={(selected) => setFormData((prev) => ({ ...prev, brands: selected }))} />
            </div>
            {/* Media Input */}
            <div className="flex flex-col w-full mt-4">
              <label>Media</label>
              <input
                type="file"
                onChange={addFile}
                className="w-full px-2 py-1 border-2 rounded-md"
              />
            </div>
            
            <div className='flex-col w-full mt-4'>
              <button
                onClick={() => setView(true)}
                className="z-50 px-3 py-1 mt-2 ml-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
              >
                📷 View Gallery
              </button>
            </div>
            <div className='flex-col w-full mt-4'>
              <button
                onClick={handleSubmit}
                className="z-50 px-3 py-1 mt-2 ml-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
              >
Submit 
             </button>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
  
}
