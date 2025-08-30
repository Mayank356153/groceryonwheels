import React ,{useState,useEffect,useRef}from 'react'
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt } from 'react-icons/fa';
import { CameraIcon } from "@heroicons/react/solid";
import Select from 'react-select'
import { FaBars } from "react-icons/fa";
import axios from 'axios';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { BrowserMultiFormatReader } from '@zxing/library';
export default function StockReport() {
  const [showExportDropdown, setShowExportDropdown] = useState(false)
   const[isSidebarOpen,setSidebarOpen]=useState(true)
   const[loading,setLoading]=useState(true)
   const[options,setOptions]=useState({
    warehouses:[],
    categories:[],
    brands:[],
   })
   useEffect(()=>{
    if(window.innerWidth<768){
      setSidebarOpen(false)
    }
   },[])

   const[SelectedWarehouse,setSelectedWarehouse]=useState("all")
   const[selectedCategory,setSelectedCategory]=useState("all")
   const[selectedBrand,setSelectedBrand]=useState("all")
    
  const [sale, setSales] = useState([]); 
  const[total,setTotal]=useState(0)
  const[allItems,setAllItems]=useState([])
   const fetchWarehouses=async()=>{
    try {
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
        warehouses:[{label:"All",value:"all"},...warehouses]
       }))
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   
   const fetchCategories=async()=>{
    try {
      const response = await axios.get('api/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     
  
     const category =response.data.data.map((warehouse)=>({
      label:warehouse.name,
      value:warehouse._id
     }))
       setOptions((prev)=>({
        ...prev,
        categories:[{label:"All",value:"all"},...category]
       }))
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
   
   

   
   const fetchItems=async()=>{
    try {
      const response = await axios.get('api/items', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     console.log(response.data)
     setAllItems(response.data.data)
    
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }
  
   const fetchBrands=async()=>{
    try {
      const response = await axios.get('api/brands', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
     
     console.log(response.data);
     const brand =response.data.data.map((warehouse)=>({
      label:warehouse.brandName,
      value:warehouse._id
     }))
       setOptions((prev)=>({
        ...prev,
        brands:[{label:"All",value:"all"},...brand]
       }))
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
   }

   useEffect(()=>{
    fetchWarehouses();
    fetchCategories();
     fetchItems();
    fetchBrands();
   },[])

   const filteredTransfers = allItems.filter((transfer) => {
    const {
      warehouse,
      category,
      brand
    } = transfer;
    
    // Warehouse match
    const warehouseMatch = 
      SelectedWarehouse === "all" || 
      (warehouse && warehouse._id === SelectedWarehouse);
    
    // Category match
    const categoryMatch =
      selectedCategory === "all" ||
      (category && category._id === selectedCategory);
    
    // Brand match
    const brandMatch =
      selectedBrand === "all" ||
      (brand && brand._id === selectedBrand);
      
    return warehouseMatch && categoryMatch && brandMatch;
  });
 
  
 
  
  // Export to Excel
  const exportToExcel = () => {
    const excelData = filteredTransfers.map((item, index) => ({
      '#': index + 1,
      'Item Code': item.itemCode || '',
      'Item Name': item.itemName || '',
      'Brand': item.brand?.brandName || '',
      'Category': item.category?.name || '',
      'MRP': item.mrp || 0,
      'Seller Points': item.sellerPoints || 0,
      'Barcode': item.barcode || '',
      'Unit Price': item.priceWithoutTax || 0,
      'Tax': item.tax?.taxName || '',
      'Purchase Cost': item.purchasePrice || 0,
      'Sales Price': item.salesPrice || 0,
      'Current Stock': item.openingStock || 0,
      'Stock Value (Sale)': (item.openingStock || 0) * (item.salesPrice || 0),
      'Stock Value (Purchase)': (item.openingStock || 0) * (item.purchasePrice || 0)
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Report');
    XLSX.writeFile(workbook, 'Inventory_Report.xlsx');
  };
  
  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape'
    });
  
    // Add title
    doc.text('Inventory Report', 14, 15);
  
    // Prepare data for PDF
    const pdfData = filteredTransfers.map((item, index) => [
      index + 1,
      item.itemCode || 'N/A',
      item.itemName || 'N/A',
      item.brand?.brandName || 'N/A',
      item.category?.name || 'N/A',
      item.mrp?.toFixed(2) || '0.00',
      item.sellerPoints || '0',
      item.barcode || 'N/A',
      item.priceWithoutTax?.toFixed(2) || '0.00',
      item.tax?.taxName || 'N/A',
      item.purchasePrice?.toFixed(2) || '0.00',
      item.salesPrice?.toFixed(2) || '0.00',
      item.openingStock || '0',
      ((item.openingStock || 0) * (item.salesPrice || 0)).toFixed(2),
      ((item.openingStock || 0) * (item.purchasePrice || 0)).toFixed(2)
    ]);
  
    // Add table to PDF
    autoTable(doc, {
      head: [
        ['#', 'Item Code', 'Item Name', 'Brand', 'Category', 'MRP', 
         'Seller Points', 'Barcode', 'Unit Price', 'Tax', 'Purchase Cost',
         'Sales Price', 'Current Stock', 'Stock Value (Sale)', 'Stock Value (Purchase)']
      ],
      body: pdfData,
      startY: 20,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [33, 150, 243], // Blue header
        textColor: 255 // White text
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 12 },
        6: { cellWidth: 15 },
        7: { cellWidth: 20 },
        8: { cellWidth: 12 },
        9: { cellWidth: 12 },
        10: { cellWidth: 15 },
        11: { cellWidth: 12 },
        12: { cellWidth: 15 },
        13: { cellWidth: 20 },
        14: { cellWidth: 20 }
      }
    });
  
    doc.save('Inventory_Report.pdf');
  };
           
          

  useEffect(()=>console.log(filteredTransfers),[filteredTransfers])
  useEffect(()=>console.log("sale"),[sale])

  
    return (
      <div className="flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-grow">
            <div>
                
          <Sidebar isSidebarOpen={isSidebarOpen} />
            </div>
    
          {/* Main Content */}
          <div className="relative flex flex-col flex-grow px-4 py-6 bg-gray-100">
            {/* Header */}
            <header className="flex flex-col items-center justify-between sm:flex-row">
              <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
                <h1 className="text-lg font-semibold truncate sm:text-xl">Stock Report</h1>
              </div>
              <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                  <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                </NavLink>
                
                <NavLink to="/reports/sale-" className="text-gray-700 no-underline hover:text-cyan-600">
                  &gt; stock Report
                </NavLink>
              </nav>
            </header>
            
            <div className='flex flex-col w-full mx-auto mt-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-600'>
              <div className='w-full h-auto px-2 border-b-2 border-gray-200'>
                <h4 className='text-gray-700'>Please Enter Valid Information</h4>
              </div>
              <div className='py-4 '>


                {/* //first row */}
                <div className='flex w-full gap-5 px-4 mb-4'>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">Warehouse</label>
                    <Select className='w-full' options={options.warehouses} onChange={(option)=>setSelectedWarehouse(option.value)} value={options.warehouses.find(option => option.value===SelectedWarehouse)}/>
                  </div>
                  <div className='hidden w-full md:flex '>
                    
                  </div>
                </div>

                {/* second row */}
                <div className='flex w-full gap-5 px-4 mb-4'>
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">Category</label>
                    <Select className='w-full' options={options.categories} onChange={(option)=>setSelectedCategory(option.value)} value={options.categories.find(option => option.value===selectedCategory) || null}/>
                  </div>
                 
                  <div className='flex flex-col w-full'>
                    <label htmlFor="">Brand</label>
                    <Select className='w-full' options={options.brands} onChange={(option)=>setSelectedBrand(option.value)} value={options.brands.find(option => option.value===selectedBrand) || null}/>
                  </div>
                </div>
                
              </div>
            </div>

            <div className='flex flex-col w-full mt-5 bg-white border-t-4 border-gray-400'>
              

            
             <div className='flex w-full px-2 py-2'>
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
              <div className='flex w-full px-2 py-2'>
                <div className='w-full overflow-x-auto'>
                  <table className="min-w-full gap-2 border-separate">
                    <thead>
                      <tr>
                        <th className="px-2 text-sm text-white bg-blue-500 ">#</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Item Code</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Item Name</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Brand</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Category</th>
                        <th className="px-2 text-sm text-white bg-blue-500">MRP</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Seller Points</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Barcode</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Unit Price</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Tax</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Purchase Cost</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Sales Price</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Current Stock</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Stock Value <br /> (By Sale Price)</th>
                        <th className="px-2 text-sm text-white bg-blue-500">Stock Value <br /> (By Purchase Price)</th>
                       
                      </tr>
                    </thead>
                    <tbody>
                      {/* Add your data rows here */}
                     
                      {
                        filteredTransfers.length>0 && filteredTransfers.map((item,index)=>(
                          <tr key={index} className='bg-gray-100 border-2 border-black'>
                            <td className="px-2">{index+1}</td>
                            <td className="px-2">{item.itemCode}</td>
                            <td className="px-2">{item.itemName}</td>
                            <td className="px-2 ">{item.brand?.brandName}</td>
                            <td className="px-2">{item.category?.name}</td>
                            <td className="px-2 ">{item.mrp}</td>
                            <td className="px-2">{item.sellerPoints}</td>
                            <td className="px-2 ">{item.barcode}</td>
                            <td className="px-2">{item.priceWithoutTax}</td>
                            <td className="px-2">{item.tax?.taxName}</td>
                            <td className="px-2">{item.purchasePrice}</td>
                            <td className="px-2">{item.salesPrice}</td>
                            <td className="px-2">{item.openingStock}</td>
                            <td className="px-2">{item.openingStock * item.salesPrice}</td>
                            <td className="px-2">{item.openingStock * item.purchasePrice}</td>
                           
                          </tr>
                        ))
                      }
                      {
                        filteredTransfers.length===0 && (
                          <tr className='bg-gray-100 border-2 border-black' >
                          <td className="px-4 py-2 text-center" colSpan='15'><h5>No Data Found</h5></td>
                        </tr>
                        )
                      }

                      
                      {/* Repeat for more rows */}
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
