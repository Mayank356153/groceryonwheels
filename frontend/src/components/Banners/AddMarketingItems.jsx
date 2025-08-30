import React, { useEffect, useState,useRef } from "react";
import { CameraIcon } from "@heroicons/react/outline";
import { FaTachometerAlt } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from "axios";
import Select from 'react-select'
import { useSearchParams,NavLink } from 'react-router-dom';
import LoadingScreen from "../../Loading.jsx";
import Button from "../contact/Button.jsx";
import { BrowserMultiFormatReader } from "@zxing/browser";
const AddMarketingItems = () => {
  const[searchParams]=useSearchParams()
  const id=searchParams.get("id")
  const[isSidebarOpen,setSidebarOpen]=useState(true)
  const[loading,setLoading]=useState(false)
  const[items,setItems]=useState([])
  const[selecteditemname,setSelecteditemName]=useState("")
  const[result,setResult]=useState("")
  const[formData,setFormData]=useState({
    type:"",
    item:"" 
  })
  useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])

   const fetchItems=async()=>{
    try {
      setLoading(true)
      const response = await axios.get("api/items", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
     console.log(response.data)
   
     setItems(response.data.data)
    } catch (error) {
      console.error("Error fetching item code:", error);
    }
    finally{
      setLoading(false)
    }
   }

   
   const fetchMarketingItem=async()=>{
    try {
      setLoading(true)
      const response = await axios.get(`api/marketing-item/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
        console.log(response.data.data)
        const types=Object.keys(response.data.data)
        for (const type of types) {
          const dataArray = response.data.data[type].filter((item) => item._id === id);
          
          if (dataArray.length > 0) {
            const data = dataArray[0]; // since filter returns an array
        
            setFormData({
              type: data.type, // use the current type from the loop
              items: data.item?._id, // assuming this is the item id
            });
        
            setSelecteditemName(data.item?.itemName); // assuming `data` has a name field
          
            break; // stop the loop once a match is found
          }
        }
        
      
    } catch (error) {
      console.error("Error fetching :", error);
    }
    finally{
      setLoading(false)
    }
   }
   
   useEffect(()=>{
    fetchItems();
    if(id) fetchMarketingItem()
   },[])
  
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

   const handleSubmit=async(e)=>{
    e.preventDefault()
    try {
      setLoading(true)
      console.log(formData)

      if(!id){
        const response = await axios.post("api/marketing-item/add",formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
       console.log(response)
      alert("marketing item successfully")
      setFormData({
        type:"",
        item:"" 
      })
      }
      else{
        const response = await axios.put(`api/marketing-item/${id}`,formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
       console.log(response)
      alert("marketing item update successfully")
      }
     
   
    } catch (error) {
      console.error("Error", error);
    }
    finally{
      setLoading(false)
    }
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
              <h1 className="text-lg font-semibold truncate sm:text-xl">New Marketing Item</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update marketingitem</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/marketingitem/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Marketing Item List
                          </NavLink>    
                          <NavLink to="/marketingitem/add" className="text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Add Marketing Item
                          </NavLink>
              
            </nav>
          </header>

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            
              
            
               <form onSubmit={handleSubmit}>
                 <div className="flex flex-col gap-2">
                  <div className="flex flex-col w-full">
                    <label htmlFor=""> Type</label>
                     <input type="text" name="type" className="px-2 py-1 border-2 rounded-md"  value={formData.type} onChange={(e)=>setFormData((prev) => ({...prev,type:e.target.value}))}/>
                  </div>
                  <div className="relative flex flex-col w-full py-2">
                    <label htmlFor="">Items</label>
                    <label htmlFor="" className="flex">
                    <input type="text" name="type" className="w-full px-2 py-1 border-2 rounded-md"  value={selecteditemname} onChange={(e)=>{setResult(e.target.value) ; setSelecteditemName(e.target.value)}}/>
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
          onClick={() => {setSelecteditemName(list.itemName);setFormData((prev)=>({...prev,item:list._id}));setResult("")}}
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
                               <div className='flex flex-col items-center justify-around w-full gap-2 mx-auto sm:flex-row'>
                                 <Button className="w-full text-white bg-green-500 rounded cursor-pointer hover:bg-green-600" type='submit' text={id?"Update":"Save"} /> {/* Save button */}
                                 <Button className="w-full text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600" text="Close" /> {/* Close button */}
                               </div>
          
            </form>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default AddMarketingItems;
