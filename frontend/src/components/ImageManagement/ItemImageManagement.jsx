import React from 'react'
import Select from 'react-select'
import { useState,useEffect ,useRef} from 'react'
import axios, { all } from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from "../Navbar.jsx";
import Button from '../contact/Button.jsx'
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from 'react-icons/fa'
import { CameraIcon } from '@heroicons/react/solid'
import { BrowserMultiFormatReader } from "@zxing/library";
import ItemMasterImage from './ItemMasterImage.jsx'
import Sidebar from "../Sidebar.jsx"
const  ItemImageManagement=()=> {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const[result,setResult]=useState("")
    const[scanning,setScanning]=useState(false)
    const[items,setItems]=useState([])
     const [selectedImageId, setSelectedImageId] = useState(null);
 const [filteredItems, setFilteredItems] = useState([]);
 const[tableitems,setTableItems]=useState([])
    const[selecteditemname,setSelecteditemName]=useState("")
    const [selectMaster,setSelectMaster]=useState(false)
    const[selectedItem,setSelectedItem]=useState({})
    const [masterItems,setMasterItems]=useState(0)
    const [totalItems,setTotalItems]=useState(0)
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[window.innerWidth])
    
    
     


    const fetchItems = async () => {
  try {
    const response = await axios.get('/api/items', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    let allItems = response.data.data;

    // Sort: items without masterImage first
    allItems.sort((a, b) => {
      const hasA = a.masterImage ? 1 : 0;
      const hasB = b.masterImage ? 1 : 0;
      return hasA - hasB;
    });
     setMasterItems(allItems.filter(i=>i.masterImage).length);
     setTotalItems(allItems.filter(i=> i.itemImages.length !=0 ).length);
    console.log("Items", allItems);

    setItems(allItems.filter(i=> i.itemImages.length !=0 && i.masterImage !=""));
    setFilteredItems(allItems.filter(i=> i.itemImages.length !=0 && i.masterImage !=""));
    setTableItems(allItems.filter(i=> i.itemImages.length !=0 && i.masterImage !=""));

  } catch (error) {
    console.error("Error fetching stores:", error);
  }
};


     
     useEffect(()=>{
      fetchItems();
     },[])

     

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



           

           
             

            
           
    



  

useEffect(() => {
  if (!result) {
    setFilteredItems(items);
    return;
  }

  const q = result.toLowerCase();
  const filtered = items.filter((item) => {
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.itemCode?.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  });
  
  setFilteredItems(filtered);
}, [result, items]);



useEffect(() => {
  if (!result) {
    setTableItems(items);
    return;
  }

  const q = result.toLowerCase();
  const filtered = items.filter((item) => {
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.itemCode?.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  });
  
  setTableItems(filtered);
}, [result, items]);














 const [visibleItems, setVisibleItems] = useState(15);
  const tableContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  
  const itemsToShow = tableitems.slice(0, visibleItems);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isLoading) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      if (isNearBottom && visibleItems < tableitems.length) {
        setIsLoading(true);
        // Simulate loading delay
        setTimeout(() => {
          setVisibleItems(prev => Math.min(prev + 15, tableitems.length));
          setIsLoading(false);
        }, 500);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleItems, tableitems.length, isLoading]);

   
  useEffect(()=>console.log("aa",tableitems),[tableitems])
const clickTimer = useRef(null);

const handleClick = (id,img) => {
  // wait to see if it's a double click
  clickTimer.current = setTimeout(() => {
    handleSetMasterImage(id,img); // single click action
  }, 250); // 250ms threshold
};

const handleDoubleClick = (img) => {
  clearTimeout(clickTimer.current); // cancel single click
  setSelectedImageId(`/vps/uploads/qr/items/${img}`); // double click action
};
const handleSetMasterImage =async (id,image) => {
    setSelectedImageId(image);
     const tokenHeader =  () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });
    try{
        const res = await axios.put(
        "api/items/assign/master_image",{
                  id:id,
                  image:image
        },
        tokenHeader()
      );
      console.log(res)
      setTableItems(tableitems.filter(i=>i._id!==id))
      setMasterItems(masterItems-1)
    }
    catch(error){
      console.log("ERro in assigning master image",error)
    }
    
    
  };



  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">
         <div>
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
         </div>
          
           {/* Content */}
         <div className={` flex flex-col p-2 md:p-2  w-full`}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Item Master Image</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Master</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/banners/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Item Master Image
                          </NavLink>    
                          
              
            </nav>
          </header>

          {
            selectMaster && <ItemMasterImage item={selectedItem}   onClose={() => 
              {
                fetchItems();
               setSelectMaster(false) 
              }
            } />
          }

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
 
               
                 <div className="flex gap-5">

                    
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
                                     {result !== "" && filteredItems.length > 1 && (
                   <div
                     className="absolute z-50 w-full overflow-y-auto bg-white border rounded-lg shadow-lg top-20 sm:w-96 max-h-60 touch-auto"
                     style={{ WebkitOverflowScrolling: 'touch' }} // enables momentum scrolling on iOS
                   >
                     <ul>
                       {filteredItems.map((list) => (
                         <li
                           key={list.itemCode}
                           onClick={() => {setResult(list.itemCode);setSelecteditemName(list.itemName)}}
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
  
    <div className="flex gap-6 mt-2 text-sm font-medium text-gray-700">
  <span>Total Items: <strong>{totalItems-masterItems}</strong></span>
  <span>Items with Master Image: <strong>{masterItems}</strong></span>
</div>


                    

                       
                     <div   ref={tableContainerRef}
      className='w-full mt-4 overflow-x-auto min-h-16 max-h-screen overflow-y-auto'
    >
    <table className='min-w-full border-2 divide-y divide-gray-200 min-h-48'>
  <thead className='sticky top-0 bg-gray-200'>
    <tr>
      <th className='py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
        Item Name & Images
      </th>
    </tr>
  </thead>
  <tbody className='bg-white divide-y divide-gray-200'>
    {itemsToShow.map((user, index) => (
      <tr key={index}>
        <td className='py-4 text-sm text-gray-500 whitespace-nowrap'>
          <div className="flex items-center gap-3 w-full overflow-x-auto">
            {/* Item Name */}
            <span className="font-medium min-w-[120px]">{user.itemName || "NA"}</span>

            {/* Images */}
            <div className="flex gap-2">
              {user.itemImages && user.itemImages.length > 0 ? (
                user.itemImages.map((img, i) => (
                  <img 
                    key={i} onClick={() => handleSetMasterImage(user._id, img)}
                        // onClick={() => handleDoubleClick(img)}
                    loading="lazy" 
                    src={`/vps/uploads/qr/items/${img}`}
                    alt={user.itemName}
                    className="w-12 h-12 rounded border object-cover hover:scale-105 transition-transform hover:shadow-lg hover:cursor-pointer"
                  />
                ))
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>


      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
    
    </div>                 
            </div>
          </div>
        </div>
      </div>
  )
}

export default ItemImageManagement
