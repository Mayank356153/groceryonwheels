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
import { BrowserMultiFormatReader } from '@zxing/library';
export default function ItemTransfer() {
  const [showExportDropdown, setShowExportDropdown] = useState(false)
   const[isSidebarOpen,setSidebarOpen]=useState(true)
   const[loading,setLoading]=useState(true)
   const[allItems,setAllItems]=useState([])
   const[sales,setSales]=useState([])
   const[stockTransfer,setStockTransfer]=useState([])
   const[items,setItems]=useState([])
   const[options,setOptions]=useState({
    warehouses:[],
   })
   useEffect(()=>{
    if(window.innerWidth<768){
      setSidebarOpen(false)
    }
   },[])
   const Navigate=useNavigate();
   const[SelectedWarehouse,setSelectedWarehouse]=useState("")
   const[resultItems,setResultItems]=useState([])
   const[view,setView]=useState(false)


   const[filteredSales,setFilteredSales]=useState([])
   const[filteredStock,setFilteredStock]=useState([])
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
  const[dateFrom,setDateFrom]=useState("all")   
  const[dateTo,setDateTo]=useState("all")   

 
   const fetchSales=async()=>{
    try {
      setLoading(true)
      const response = await axios.get('api/sales', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     console.log("sale")
   console.log(response.data)
   setSales(response.data.sales)
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   
   const fetchStockTransfer=async()=>{
    try {
      setLoading(true)
      const response = await axios.get('api/stock-transfers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     console.log("transfer")
     console.log(response.data)
   setStockTransfer(response.data.data)
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   
   useEffect(()=>{
    fetchWarehouses();
    fetchSales();
    fetchStockTransfer();
   },[])

  //  function getFilteredGroupedItems(sales, SelectedWarehouse) {
  //       const WarehouseSales=sales.filter(sale=>sale.warehouse?._id===SelectedWarehouse)
          
  //       return WarehouseSales;
  // }

  
  // function getFilteredGroupedItems(sales, selectedWarehouse) {
  //   // Validate inputs
  //   if (!Array.isArray(sales) || !selectedWarehouse) {
  //     return [];
  //   }
  
  //   // Filter sales by warehouse and extract items
  //   const items = sales
  //     .filter(sale => 
  //       sale?.warehouse?._id?.toString() === selectedWarehouse.toString()
  //     )
  //     .flatMap(sale => 
  //       Array.isArray(sale.items) 
  //         ? sale.items.map(item => ({
  //             ...item,
  //             saleDate: sale.saleDate,
  //             saleCode: sale.saleCode,
  //             customer: sale.customer
  //           }))
  //         : []
  //     );
  
  //   return items;
  // }

  
  


  const filteredItems = sales.filter((transfer) => {
    const { warehouse, saleDate } = transfer;
  
    const warehouseMatch = warehouse && warehouse._id === SelectedWarehouse;
  
    const date = new Date(saleDate);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
  
    const dateMatch = date >= from && date <= to;
  
    return warehouseMatch && dateMatch;
  });
  

  






  const filteredItems2 = stockTransfer.filter((transfer) => {
    const { toWarehouse, transferDate } = transfer;
  
    const warehouseMatch =
      toWarehouse && toWarehouse._id === SelectedWarehouse;
  
    const date = new Date(transferDate);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
  
    const dateMatch = date >= from && date <= to;
  
    return warehouseMatch && dateMatch;
  });
  
  
  
  
  const handleCompare=(e)=>{
    e.preventDefault();
    try {
      setLoading(true)
      setView(false)
      if(!SelectedWarehouse){
        alert("one of the warehouse is not selected")
        return;
      }
      
   setFilteredSales(filteredItems)
   console.log(filteredItems2)
   setFilteredStock(filteredItems2)
   function getItemsTransferredMoreThanSold(filteredTransfers, filteredSales) {
    const transferMap = new Map();
    const salesMap = new Map();
  
    // 1. Aggregate transferred quantities
    filteredTransfers.forEach(transfer => {
      (transfer.items || []).forEach(it => {
        const id = it.item?._id;
        if (!id) return;
  
        const qty = it.quantity || 0;
        const itemName = it.item?.itemName || 'Unnamed Item';
  
        if (transferMap.has(id)) {
          const existing = transferMap.get(id);
          existing.transferred += qty;
        } else {
          transferMap.set(id, {
            _id: id,
            itemName,
            transferred: qty,
            sold: 0
          });
        }
      });
    });
  
    // 2. Aggregate sold quantities
    filteredSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const id = item.item?._id || item._id;
        if (!id) return;
  
        const qty = item.quantity || 0;
        const itemName = item.item?.itemName || item.itemName || 'Unnamed Item';
  
        if (transferMap.has(id)) {
          const existing = transferMap.get(id);
          existing.sold += qty;
        } else if (salesMap.has(id)) {
          const existing = salesMap.get(id);
          existing.sold += qty;
        } else {
          salesMap.set(id, {
            _id: id,
            itemName,
            transferred: 0,
            sold: qty
          });
        }
      });
    });
  
    // 3. Combine results
    const result = [];
  
    // Case 1: Items with transferred < sold
    for (const entry of transferMap.values()) {
      if (entry.transferred < entry.sold) {
        result.push(entry);
      }
    }
  
    // Case 2: Items sold but never transferred
    for (const [id, entry] of salesMap.entries()) {
      result.push(entry);
    }
  
    return result;
  }
  
  const result=getItemsTransferredMoreThanSold(filteredItems2,filteredItems)
  console.log(result)
  setResultItems(getItemsTransferredMoreThanSold(filteredItems2,filteredItems))
      // setResultItems(getNonCommonItems(filteredItems1,filteredItems2))
      // if(getNonCommonItems(filteredItems1,filteredItems2) ==[]) {
      //       alert("No item is unique")
      //       return;
      // }
    } catch (error) {
      console.log("Error in comparing",error.message)
    }
    finally{
      
      if(SelectedWarehouse){
         setView(true)
      }
      setLoading(false)
    }
  }
 


 

// Excel Export
const exportToExcel = () => {
  // Prepare data for Items Sold
  const soldData = [];
  filteredSales.forEach((sale, index) => {
    sale.items?.forEach((item) => {
      soldData.push({
        '#': index + 1,
        'Type': 'Items Sold',
        'Item Name': item.item?.itemName || 'NA',
        'Quantity': item.quantity,
        'Date': sale.date || 'NA'
      });
    });
  });

  // Prepare data for Items Transferred
  const transferredData = [];
  filteredStock.forEach((stock, index) => {
    stock.items?.forEach((item) => {
      transferredData.push({
        '#': index + 1,
        'Type': 'Items Transferred',
        'Item Name': item.item?.itemName || 'NA',
        'Quantity': item.quantity,
        'Date': stock.date || 'NA'
      });
    });
  });

  // Prepare data for Items to Transfer
  const toTransferData = resultItems.map((item, index) => ({
    '#': index + 1,
    'Type': 'Items to Transfer',
    'Item Name': item.itemName,
    'Quantity': (item.sold - item.transferred),
    'Date': 'NA'
  }));

  // Combine all data
  const allData = [...soldData, ...transferredData, ...toTransferData];

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(allData);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "InventoryReport");
  
  // Export the file
  XLSX.writeFile(wb, "Inventory_Report.xlsx");
};

// PDF Export
const exportToPDF = () => {
  const doc = new jsPDF();
  let yPos = 10;

  // Add title
  doc.setFontSize(18);
  doc.text('Inventory Movement Report', 105, yPos, { align: 'center' });
  yPos += 15;

  // Items Sold Table
  doc.setFontSize(14);
  doc.text('Items Sold', 14, yPos);
  yPos += 8;
  
  const soldRows = [];
  filteredSales.forEach((sale, index) => {
    sale.items?.forEach((item) => {
      soldRows.push([
        index + 1,
        item.item?.itemName || 'NA',
        item.quantity,
        new Date(sale.saleDate).toISOString() || 'NA'
      ]);
    });
  });

  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Quantity', 'Date']],
    body: soldRows.length > 0 ? soldRows : [['No data available', '', '', '']],
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Items Transferred Table
  doc.setFontSize(14);
  doc.text('Items Transferred to Warehouse', 14, yPos);
  yPos += 8;
  
  const transferredRows = [];
  filteredStock.forEach((stock, index) => {
    stock.items?.forEach((item) => {
      transferredRows.push([
        index + 1,
        item.item?.itemName || 'NA',
        item.quantity,
        new Date(stock.transferDate).toISOString() || 'NA'
      ]);
    });
  });

  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Quantity', 'Date']],
    body: transferredRows.length > 0 ? transferredRows : [['No data available', '', '', '']],
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Items to Transfer Table
  doc.setFontSize(14);
  doc.text('Items Required to Transfer', 14, yPos);
  yPos += 8;
  
  const toTransferRows = resultItems.map((item, index) => [
    index + 1,
    item.itemName,
    (item.sold - item.transferred),
    'NA'
  ]);

  autoTable(doc,{
    startY: yPos,
    head: [['#', 'Item Name', 'Quantity', 'Date']],
    body: toTransferRows.length > 0 ? toTransferRows : [['No items to transfer', '', '', '']],
    margin: { top: 10 },
    styles: { fontSize: 10 }
  });

  // Save the PDF
  doc.save('Inventory_Movement_Report.pdf');
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
                <h1 className="text-lg font-semibold truncate sm:text-xl">Item Transfer</h1>
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
                    <label htmlFor="">Warehouse</label>
                    <Select className='w-full' options={options.warehouses} onChange={(option)=>setSelectedWarehouse(option.value)} value={options.warehouses.find(option => option.value===SelectedWarehouse)}/>
                  </div>
                  <div className='hidden w-full md:flex'>
                  </div>
                </div>
                <div className='flex w-full gap-5 px-4'>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">From Date</label>
                    <input type="date" name="type" className="w-full px-2 py-1 border-2 rounded-md"  onChange={(e)=>setDateFrom(e.target.value)}/>
                  </div>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">To Date</label>
                    <input type="date" name="type" className="w-full px-2 py-1 border-2 rounded-md"  onChange={(e)=>setDateTo(e.target.value)}/>
                  </div>
                </div>
                <div className='flex flex-col justify-around w-full gap-4 px-2 mt-2 md:justify-center md:flex-row'>
   <button 
    className='px-6 py-2 text-white transition-colors duration-300 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
    onClick={handleCompare}
    type="button"
  >
    Show
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
                  <h5 className='text-center'>Items Sold</h5>
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
  filteredSales.length > 0 &&
  filteredSales.map((item, index) =>
    item.items?.map((it, subIndex) => (
      <tr key={`${index}-${subIndex}`} className="bg-gray-100 border-2 border-black">
        <td className="px-4 py-2">{index + 1}</td>
        <td className="px-4 py-2">{it.item?.itemName}</td>
        <td className="px-4 py-2">{it.quantity}</td>
      </tr>
    ))
  )
}
                      { view &&
                        filteredSales.length===0  && view && (
                          <tr className='bg-gray-100 border-2 border-black' >
                          <td className="px-4 py-2 text-center" colSpan='10'><h5>No Data Found</h5></td>
                        </tr>
                        )
                      }
                     </tbody>
                  </table>

                </div>
                
                <div className='w-full h-auto bg-white border-2'>
                  <h5 className='text-center'>Items transferred to warehouse </h5>
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
  filteredStock.length > 0 &&
  filteredStock.map((item, index) =>
    item.items?.map((it, subIndex) => (
      <tr key={`${index}-${subIndex}`} className="bg-gray-100 border-2 border-black">
        <td className="px-4 py-2">{index + 1}</td>
        <td className="px-4 py-2">{it.item?.itemName || "NA"}</td>
        <td className="px-4 py-2">{it.quantity }</td>
      </tr>
    ))
  )
}

                      { view &&
                        filteredStock.length===0 && view && (
                          <tr className='bg-gray-100 border-2 border-black' >
                          <td className="px-4 py-2 text-center" colSpan='10'><h5>No Data Found</h5></td>
                        </tr>
                        )
                      }
                     </tbody>
                  </table>

                </div>

                <div className='w-full overflow-x-scroll bg-white border-2'>
                  <h5 className='text-center'>Items required to transfer</h5>
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
                     
                       {
                        resultItems.length>0 && resultItems.map((item,index)=>(
                          <tr key={index} className='bg-gray-100 border-2 border-black'>
                            <td className="px-4 py-2">{index+1}</td>
                            <td className="px-4 py-2">{item.itemName}</td>
                            <td className="px-4 py-2">{item.sold-item.transferred}</td>
                          </tr>
                        ))
                      }
                      {view &&
                        resultItems.length===0 &&(
                          <tr  className='bg-gray-100 border-2 border-black'>
                          <td className="px-4 py-2 text-center" colSpan='4' >No item to transfer</td>
                         
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
