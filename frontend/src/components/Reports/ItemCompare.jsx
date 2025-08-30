import React ,{useState,useEffect,useRef, use}from 'react'
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import { FaTachometerAlt } from 'react-icons/fa';
import { CameraIcon } from "@heroicons/react/solid";
import Select from 'react-select'
import { FaBars } from "react-icons/fa";
import axios from 'axios';
import LoadingScreen from '../../Loading';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

export default function ItemCompare() {
  const [showExportDropdown, setShowExportDropdown] = useState(false)
   const[isSidebarOpen,setSidebarOpen]=useState(true)
   const[loading,setLoading]=useState(true)
   const[allItems,setAllItems]=useState([])
   const[options,setOptions]=useState({
    warehouses:[],
   })
   useEffect(()=>{
    if(window.innerWidth<768){
      setSidebarOpen(false)
    }
   },[])
   const Navigate=useNavigate();
   const[SelectedWarehouse1,setSelectedWarehouse1]=useState("")
   const[SelectedWarehouse2,setSelectedWarehouse2]=useState("")
   const[resultItems,setResultItems]=useState([])
   const[view,setView]=useState(false)
   const fetchWarehouses=async()=>{
    try {
      setLoading(true)
      const response = await axios.get('api/warehouses', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     
  
     const warehouses =response.data.data.map((warehouse)=>({
      label:warehouse.warehouseName,
      value:warehouse._id
     }))
       setOptions((prev)=>({
        ...prev,
        warehouses:warehouses
       }))
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   

   
   const fetchItems=async()=>{
    try {
      setLoading(true)
      const response = await axios.get('api/items', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     
   setAllItems(response.data.data)
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   
   useEffect(()=>{
    fetchWarehouses();
    fetchItems();
   },[])

   
   const filteredItems1 = allItems.filter((transfer) => {
    const {
      warehouse,
    } = transfer;
    
    // Warehouse match
    const warehouseMatch =  
      (warehouse && warehouse._id === SelectedWarehouse1);
    
   
      
    return warehouseMatch ;
  });


  const filteredItems2 = allItems.filter((transfer) => {
    const {
      warehouse,
    } = transfer;
    
    // Warehouse match
    const warehouseMatch =  
      (warehouse && warehouse._id === SelectedWarehouse2);
    
   
      
    return warehouseMatch ;
  });

  
  const getNonCommonItems = (filteredItems1, filteredItems2) => {
    // Get IDs from both arrays
    const ids1 = new Set(filteredItems1.map(item => item._id.toString()));
    const ids2 = new Set(filteredItems2.map(item => item._id.toString()));
  
    // Items in array1 but not in array2
    const uniqueToArray1 = filteredItems1.filter(item => 
      !ids2.has(item._id.toString())
    );
  
  
  
    // Combine both sets of unique items
    return uniqueToArray1;
  };
  
  
  const handleCompare=(e)=>{
    e.preventDefault();
    try {
      setLoading(true)
      setView(false)
      if(!setSelectedWarehouse1 || !SelectedWarehouse2){
        alert("one of the warehouse is not selected")
        return;
      }
      setResultItems(getNonCommonItems(filteredItems1,filteredItems2))
      if(getNonCommonItems(filteredItems1,filteredItems2) ==[]) {
            alert("No item is unique")
            return;
      }
    } catch (error) {
      console.log("Error in comparing",error.message)
    }
    finally{
      
      if(setSelectedWarehouse1 && SelectedWarehouse2){
         setView(true)
      }
      setLoading(false)
    }
  }
  useEffect(()=>console.log(filteredItems1),[filteredItems1])
  useEffect(()=>console.log(filteredItems2),[filteredItems2])
 
 
  const exportToExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Add headers for Warehouse 1
    XLSX.utils.sheet_add_aoa(ws, [["Warehouse 1 Items"]], { origin: -1 });
    XLSX.utils.sheet_add_aoa(ws, [["#", "Item Name", "Quantity"]], { origin: -1 });
    
    // Add Warehouse 1 data
    filteredItems1.forEach((item, index) => {
      XLSX.utils.sheet_add_aoa(ws, [[index + 1, item.itemName, item.openingStock]], { origin: -1 });
    });
    
    // Add empty row
    XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: -1 });
    
    // Add headers for Warehouse 2
    XLSX.utils.sheet_add_aoa(ws, [["Warehouse 2 Items"]], { origin: -1 });
    XLSX.utils.sheet_add_aoa(ws, [["#", "Item Name", "Quantity"]], { origin: -1 });
    
    // Add Warehouse 2 data
    filteredItems2.forEach((item, index) => {
      XLSX.utils.sheet_add_aoa(ws, [[index + 1, item.itemName, item.openingStock]], { origin: -1 });
    });
    
    // Add empty row
    XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: -1 });
    
    // Add headers for Unique Items
    XLSX.utils.sheet_add_aoa(ws, [["Unique Items"]], { origin: -1 });
    XLSX.utils.sheet_add_aoa(ws, [["#", "Item Name", "Warehouse", "Quantity"]], { origin: -1 });
    
    // Add Unique Items data
    resultItems.forEach((item, index) => {
      XLSX.utils.sheet_add_aoa(ws, [[index + 1, item.itemName, item.warehouse?.warehouseName, item.openingStock]], { origin: -1 });
    });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "InventoryData");
    
    // Export the file
    XLSX.writeFile(wb, "Inventory_Report.xlsx");
  };
  

  // PDF Export
const exportToPDF = () => {
  const doc = new jsPDF();
  let yPos = 10;

  // Add title
  doc.setFontSize(18);
  doc.text('Inventory Report', 105, yPos, { align: 'center' });
  yPos += 15;

  // Warehouse 1 Table
  doc.setFontSize(14);
  doc.text('Warehouse 1 Items', 14, yPos);
  yPos += 8;
  
  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Quantity']],
    body: filteredItems1.map((item, index) => [index + 1, item.itemName, item.openingStock]),
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Warehouse 2 Table
  doc.setFontSize(14);
  doc.text('Warehouse 2 Items', 14, yPos);
  yPos += 8;
  
  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Quantity']],
    body: filteredItems2.map((item, index) => [index + 1, item.itemName, item.openingStock]),
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Unique Items Table
  doc.setFontSize(14);
  doc.text('Unique Items', 14, yPos);
  yPos += 8;
  
  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Warehouse', 'Quantity']],
    body: resultItems.map((item, index) => [
      index + 1, 
      item.itemName, 
      item.warehouse?.warehouseName || '', 
      item.openingStock
    ]),
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });

  // Save the PDF
  doc.save('Inventory_Report.pdf');
};


  
    return (
      <div className="flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-grow">
          <Sidebar isSidebarOpen={isSidebarOpen} />
    
          {/* Main Content */}
          <div className="relative flex flex-col flex-grow w-full px-4 py-6 bg-gray-100">
            {/* Header */}
            <header className="flex flex-col items-center justify-between sm:flex-row">
              <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
                <h1 className="text-lg font-semibold truncate sm:text-xl">Item Compare</h1>
              </div>
              <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                  <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                </NavLink>
                
                <NavLink to="/reports/sale-item" className="text-gray-700 no-underline hover:text-cyan-600">
                  &gt; sale item Report
                </NavLink>
              </nav>
            </header>
            
            <div className='flex flex-col w-full mx-auto mt-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-600'>
              <div className='w-full h-auto px-2 border-b-2 border-gray-200'>
                <h4 className='text-gray-700'>Please Enter Valid Information</h4>
              </div>
              <div className='py-4 '>


                {/* //first row */}
                <div className='flex flex-col w-full gap-4 px-4 mb-4 md:flex-row md:gap-5'>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">Warehouse1</label>
                    <Select className='w-full' options={options.warehouses} onChange={(option)=>{setView(false);setSelectedWarehouse1(option.value);setResultItems([])}} value={options.warehouses.find(option => option.value===SelectedWarehouse1)}/>
                  </div>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">Warehouse 2</label>
                    <Select className='w-full' options={options.warehouses} onChange={(option)=>{setView(false);setSelectedWarehouse2(option.value);setResultItems([])}} value={options.warehouses.find(option => option.value===SelectedWarehouse2)}/>
                  </div>
                </div>
                <div className='flex flex-col justify-around w-full gap-4 px-2 md:justify-center md:flex-row'>
   <button 
    className='px-6 py-2 text-white transition-colors duration-300 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
    onClick={handleCompare} disabled={!SelectedWarehouse1 && !SelectedWarehouse2}
    type="button"
  >
    Compare Warehouses
  </button>
  
  <button 
    className='px-6 py-2 text-white transition-colors duration-300 bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50'
    onClick={() => Navigate("/dashboard")} 
    type="button"
  >
    Back to Dashboard
  </button>
</div>
              </div>
            </div>

            <div className='flex flex-col w-full mt-5 border-t-4 border-gray-400'>
              

            
             <div className='flex w-full px-2 py-2 bg-white'>
  <div className='w-full'>
    <h4 className='text-gray-700'>Records Table</h4>
  </div>
  <div className="relative">
    <button 
      onClick={() => setShowExportDropdown(!showExportDropdown)}
      className="flex items-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
    >
      <FaBars className="mr-2" />
      Export
      <span className="ml-2 text-sm">▼</span>
    </button>
    
    {/* Dropdown menu - now controlled by state */}
    {showExportDropdown && (
      <div 
        className="absolute right-0 z-10 w-40 mt-2 bg-white rounded-md shadow-lg"
        onMouseLeave={() => setShowExportDropdown(false)}
      >
        <div className="py-1">
          <button 
            onClick={() => {
              exportToExcel();
              setShowExportDropdown(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button 
            onClick={() => {
              exportToPDF();
              setShowExportDropdown(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>
    )}
  </div>
</div>
{/* second row */}
               <div className='flex flex-col justify-between w-full gap-2 px-2 py-2 overflow-x-auto md:flex-row'>
                
                <div className='w-full h-auto bg-white border-2'>
                  <h5 className='text-center'>Item in Warehouse1</h5>
                  <table className="min-w-full gap-2 border-separate">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">#</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Item Name</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Add your data rows here */}
                     
                       {view &&
                        filteredItems1.length>0 && filteredItems1.map((item,index)=>(
                          <tr key={index} className='bg-gray-100 border-2 border-black'>
                            <td className="px-4 py-2">{index+1}</td>
                            <td className="px-4 py-2">{item.itemName}</td>
                            <td className="px-4 py-2">{item.openingStock}</td>
                          </tr>
                        ))
                      }
                      { view &&
                        filteredItems1.length===0  && view && (
                          <tr className='bg-gray-100 border-2 border-black' >
                          <td className="px-4 py-2 text-center" colSpan='10'><h5>No Data Found</h5></td>
                        </tr>
                        )
                      }
                     </tbody>
                  </table>

                </div>
                
                <div className='w-full h-auto bg-white border-2'>
                  <h5 className='text-center'>Item in Warehouse2</h5>
                  <table className="min-w-full gap-2 border-separate">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">#</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Item Name</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Add your data rows here */}
                     
                       {view &&
                        filteredItems2.length>0 && filteredItems2.map((item,index)=>(
                          <tr key={index} className='bg-gray-100 border-2 border-black'>
                            <td className="px-4 py-2">{index+1}</td>
                            <td className="px-4 py-2">{item.itemName}</td>
                            <td className="px-4 py-2">{item.openingStock}</td>
                          </tr>
                        ))
                      }
                      { view &&
                        filteredItems2.length===0 && view && (
                          <tr className='bg-gray-100 border-2 border-black' >
                          <td className="px-4 py-2 text-center" colSpan='10'><h5>No Data Found</h5></td>
                        </tr>
                        )
                      }
                     </tbody>
                  </table>

                </div>

                <div className='w-full overflow-x-scroll bg-white border-2'>
                  <h5 className='text-center'>Item Unique</h5>
                  <table className="min-w-full gap-2 border-separate">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">#</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Item Name</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Warehouse</th>
                        <th className="px-4 py-2 text-sm text-white bg-blue-500">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Add your data rows here */}
                     
                       {
                        resultItems.length>0 && resultItems.map((item,index)=>(
                          <tr key={index} className='bg-gray-100 border-2 border-black'>
                            <td className="px-4 py-2">{index+1}</td>
                            <td className="px-4 py-2">{item.itemName}</td>
                            <td className="px-4 py-2">{item.warehouse?.warehouseName}</td>
                            <td className="px-4 py-2">{item.openingStock}</td>
                          </tr>
                        ))
                      }
                      {view &&
                        resultItems.length===0 &&(
                          <tr  className='bg-gray-100 border-2 border-black'>
                          <td className="px-4 py-2 text-center" colSpan='4' >No item is unique</td>
                         
                        </tr>
                        )
                      }
                     
                     </tbody>
                  </table>

                </div>
                

              </div> 
              
              
            </div>
            
    
        
           
            
          </div>
        </div>
      </div>
    );
}
