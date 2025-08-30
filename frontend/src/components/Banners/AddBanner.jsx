import React, { useEffect, useState } from "react";
import { BiChevronDown, BiChevronUp, BiX, BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import Select from 'react-select'
import { NavLink } from 'react-router-dom';
import LoadingScreen from "../../Loading.jsx";
import Button from "../contact/Button.jsx";
import { CameraIcon } from "@heroicons/react/solid";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useRef } from "react";
import SingleProductView from "./SingleProductBanner.jsx";
import MultiProductView from "./MultiProductView.jsx";
const AddBanner = () => {
  const link="https://pos.inspiredgrow.in/vps"
  const[isSidebarOpen,setSidebarOpen]=useState(true)
  const[loading,setLoading]=useState(false)
  const[items,setItems]=useState([])
  const[bannerType,setBannerType]=useState([
    {
      label: "Single Product",
      value:"SingleProduct"
    },
    {
      label:"Multi Product",
      value:"MultiProduct"
     },
  ])
  const[selectedBannerType,setSelectedBannerType]=useState("SingleProduct")
 const[viewItem,setViewItem]=useState(null)
  const[singleView,setSingleView]=useState(false)
  const[multiView,setMultiView]=useState(false)
 const[result,setResult]=useState("")
  const[currentItem,setCurrentItem]=useState(null)
   const[selectedItem,setSelectedItem]=useState([])

   
  useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])


  
   const fetchItems=async()=>{
    try {
      setLoading(true)
      const response = await axios.get(`api/items`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
     setItems(response.data.data)
    } catch (error) {
      console.error("Error fetching item code:", error);
    }
    finally{
      setLoading(false)
    }
   }


   
   
   useEffect(()=>{
    fetchItems();
  
   },[])
   
  

   
   const[scanning,setScanning]=useState(false)
       const videoRef = useRef(null);
        const codeReaderRef = useRef(null);
      
        useEffect(() => {
          if (!scanning) return;
      
          const startScanner = async () => {
            if (!videoRef.current) return;
      
            const codeReader = new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;
      
            const tryDecode = async (facingMode) => {
              const constraints = {
                video: {
                  facingMode,
                  advanced: [
                    { width: 1920 },
                    { height: 1080 },
                    { zoom: 2 }, // not all devices support this
                  ],
                },
              };
      
              return codeReader.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, error) => {
                  if (result) {
                    const text = result.getText();
                    alert(text);
                    setResult(text)  
                    window.navigator.vibrate?.(200);
                    const beep = new Audio("/beep.mp3");
                    beep.play();
      
                    const stream = videoRef.current?.srcObject;
                    stream?.getTracks().forEach((track) => track.stop());
      
                    if (codeReaderRef.current?.reset && typeof codeReaderRef.current.reset === "function") {
                      codeReaderRef.current.reset();
                    }
      
                    setScanning(false);
                  }
      
                  if (error && error.name !== "NotFoundException") {
                    console.error("Scan error:", error);
                  }
                }
              );
            };
      
            try {
              await tryDecode({ exact: "environment" });
            } catch (error) {
              if (error.name === "OverconstrainedError" || error.name === "NotFoundError") {
                console.warn("Back camera not found. Trying front camera...");
                try {
                  await tryDecode("user");
                } catch (fallbackError) {
                  console.error("Front camera also failed:", fallbackError);
                  alert("No camera found or accessible.");
                  setScanning(false);
                }
              } else {
                console.error("Camera access error:", error);
                alert("Camera access error: " + error.message);
                setScanning(false);
              }
            }
          };
      
          startScanner();
      
          return () => {
            const stream = videoRef.current?.srcObject;
            stream?.getTracks().forEach((track) => track.stop());
      
            if (codeReaderRef.current?.reset && typeof codeReaderRef.current.reset === "function") {
              codeReaderRef.current.reset();
            }
          };
        }, [scanning]);

        
   const filteredItems = result
         ? items.filter((item) => {
             const q = result.toLowerCase();
             return (
               item.itemName?.toLowerCase().includes(q) ||
               item.itemCode?.toLowerCase().includes(q) ||
               (item.barcode && item.barcode.toLowerCase().includes(q))
             );
           })
         : [];
         useEffect(()=>{
           const filteredItems = result
           ? items.filter((item) => {
               const q = result.toLowerCase();
               return (
                 item.itemName?.toLowerCase().includes(q) ||
                 item.itemCode?.toLowerCase().includes(q) ||
                 (item.barcode && item.barcode.toLowerCase().includes(q))
               );
             })
           : [];
         },[result])
    
   

   const handleAddItem = () => {
    if (!currentItem) {
      console.log("No item is selected ");
      return;
    }
     console.log(currentItem)
     setSelectedItem((prevItems) => ([...prevItems, currentItem]));
     setResult("") // Clear the input field after adding the item
    // Ensure new items are added with empty fields for description, price, discount, etc.
      
    
  };
  
  useEffect(() => {
    handleAddItem();
  },[currentItem])

  useEffect(() => {console.log(selectedItem)},[selectedItem])
  
 const handleChange=(e,index)=>{
  
  const {name,value}=e.target
  setSelectedItem((prevItems) => {
    const updatedItems = [...prevItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]:e.target.type==="number"?Number (value):value,
    };
    return updatedItems;
  });
 }


 const handleSubmit=(e,index)=>{
  e.preventDefault();
  const sendingData=selectedItem[index]
  const id=sendingData._id
  console.log(sendingData)
  const sendData=async()=>{
    try {
      setLoading(true)
      const response = await axios.put(`api/items/${id}`,sendingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
     console.log(response)
     alert("updated");
    } catch (error) {
      console.error("Error fetching item code:", error);
    }
    finally{
      setLoading(false)
    }
   }
   sendData()
 }
   
   

   
   
   if(loading) return (<LoadingScreen />)
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">

        <Sidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`flex-grow flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">New Banner</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Banner</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/banners/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Banner List
                          </NavLink>    
                          <NavLink to="/banners/add" className="text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Add Banner
                          </NavLink>
              
            </nav>
          </header>

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            
{
  singleView && <SingleProductView item={viewItem} setView={setSingleView}/>
  } 


{
  multiView && <MultiProductView items={selectedItem} setMultiView={setMultiView}/>
  } 
               
                 <div className="flex gap-5">
                  <div className="w-full">
                    <label htmlFor="">Banner Type</label>
                    <Select className="w-full" options={bannerType} onChange={(option)=>setSelectedBannerType(option.value)}/>
                  </div>
                  <div className="relative flex flex-col w-full">
                    <label htmlFor="">Items</label>
                    <label htmlFor="" className="flex">
                    <input type="text" name="type" className="w-full px-2 py-1 border-2 rounded-md"  value={result} onChange={(e)=>{setResult(e.target.value)}}/>
                    <button type="button"
        className="p-2 ml-2 text-white rounded-full hover:bg-blue-600" 
        onClick={() => setScanning(true)}
      >
        <CameraIcon className="w-6 h-6 text-gray-500" />
      </button>
                    </label>
                    {result !== "" && (
  <div
    className="absolute z-50 w-full overflow-y-auto bg-white border rounded-lg shadow-lg top-20 sm:w-96 max-h-60 touch-auto"
    style={{ WebkitOverflowScrolling: 'touch' }} // enables momentum scrolling on iOS
  >
    <ul>
      {filteredItems.map((list) => (
        <li
          key={list.itemCode}
          onClick={() => {setCurrentItem(list)}}
          className="p-2 cursor-pointer hover:bg-gray-100"
        >
          <strong>{list.itemCode}</strong> - {list.itemName} - {list.barcode}
        </li>
      ))}
    </ul>
  </div>
)}
  {scanning && (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
    <div className="relative overflow-hidden border-4 border-white rounded-lg shadow-xl w-72 h-72">
      <video
        ref={videoRef}
        className="absolute object-cover w-full h-full"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute w-full h-1 bg-red-500 animate-scan" />
    </div>
    <button
      onClick={() => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());

        if (codeReaderRef.current?.reset && typeof codeReaderRef.current.reset === "function") {
          codeReaderRef.current.reset();
        }

        setScanning(false);
      }}
      className="px-4 py-2 mt-6 text-white bg-red-600 rounded hover:bg-red-700"
    >
      Cancel
    </button>
  </div>
)}

                    </div>
                 </div>
                
                  {
                    selectedItem.map((it,index)=>( 
                      <div className="py-2 mb-4 border-b-2">
                    
                      <h3>Item{index+1}:{it.itemName}</h3>
                      <div className="flex w-full gap-5 mb-4">
                       <div className="flex flex-col w-full gap-1">
                         <label htmlFor="">Description</label>
                         <input type="text" name="description"  className="w-full px-2 py-1 border-2 rounded-md" value={it.description} onChange={(e)=>handleChange(e,index)}/>
                       </div>
                       <div className="flex flex-col w-full gap-1">
                         <label htmlFor="">Purchase Price</label>
                         <input type="Number" min='0' name="purchasePrice"  className="w-full px-2 py-1 border-2 rounded-md" value={it.purchasePrice} onChange={(e)=>handleChange(e,index)}/>
                       </div>
                      </div>
                      
                      <div className="flex w-full gap-5">
                      <div className="flex flex-col w-full gap-1">
                         <label htmlFor="">Price Without Tax</label>
                         <input type="Number" min='0' name="priceWithoutTax"  className="w-full px-2 py-1 border-2 rounded-md" value={it.priceWithoutTax} onChange={(e)=>handleChange(e,index)}/>
                       </div>
     
                       <div className="flex flex-col w-full gap-1">
                         <label htmlFor="">Sales Price</label>
                         <input type="Number" min='0' onChange={(e)=>handleChange(e,index)} name="salesPrice"  className="w-full px-2 py-1 border-2 rounded-md" value={it.salesPrice}/>
                       </div>
                      </div>

                     <Button className="px-4 py-2 mt-2 text-white bg-green-500 rounded cursor-pointer hover:bg-green-600" onClick={(e)=>handleSubmit(e,index)} text="Save" /> {/* Save button */}
                      {
                        selectedBannerType==="SingleProduct" && 
                     <Button className="px-4 py-2 mt-2 text-white bg-teal-400 rounded cursor-pointer hover:bg-teal-600" type='button' onClick={()=>{setViewItem(it);setSingleView(true)} } text="view" /> 
                      }
                    
                     
                      
                     </div>
                  
                    ))
                  }
                 
                 {
                        selectedBannerType!=="SingleProduct" && 
                     <Button className="w-full px-4 py-2 mt-2 mt-5 text-white bg-teal-400 rounded cursor-pointer hover:bg-teal-600" type='button' onClick={()=>{setMultiView(true)} } text="view" /> 
                      }
                 
          
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default AddBanner;
