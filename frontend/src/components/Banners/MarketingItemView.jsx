
import React, { useState, useEffect } from 'react';
import { FaTachometerAlt ,FaEye} from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from "react-icons/fa";
import Select from 'react-select'
import ItemsImageView from './ItemsImageView.jsx';
const MarketingItemView = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const[view,setView]=useState(false)
  const[data,setData]=useState([])
  const[banners,setBanners]=useState([])
  const [allitems,setAllItems]=useState([])
  const [items, setItems] = useState([]); 
  const[selectedType,setSelectedType]=useState("All")
  const[Type,setType]=useState("")

 
    
  const [dropdownIndex, setDropdownIndex] = useState(null);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[window.innerWidth])

  
  const toggleDropdown = (id) => {
    setDropdownIndex(dropdownIndex === id ? null : id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('api/marketing-item/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
     console.log(response.data)
     console.log((response.data.data["trending"]))
     
     setAllItems(response.data.data || [])
     setItems(response.data.data["trending"] || [])
     const uniqueTypes=Object.keys(response.data.data).map((key)=>({
      label:key.toUpperCase(),
      value:key
     }))
     setType(uniqueTypes)
    } catch (err) {
      console.error("Error fetching advance payments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setItems(allitems[selectedType])
  },[selectedType])

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this ?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/marketing-item/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Deleted Successfully");
    } catch (error) {
      console.error("Error deleting advance payment:", error.message);
    } finally {
      fetchData();
      setLoading(false);
    }
  };

  // Filter data based on searchTerm
  let filteredData = items?.filter(it => 
    it.item?.itemName.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

  useEffect(()=>{
     filteredData = items?.filter(it => 
      it.item?.itemName.toLowerCase().includes(searchTerm.toLowerCase()) 
      );
      console.log(filteredData)
  },[selectedType])

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(10 / entriesPerPage);
  const currentUsers = filteredData?.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages)
      setCurrentPage(newPage);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Export functions (Copy, Excel, PDF, Print, CSV) remain unchanged...

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex">
        <div className="w-auto">
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          <header className="flex flex-col items-start justify-between p-0 mb-6 md:flex-row md:items-center">
            <h2 className="text-lg font-bold md:text-xl">Marketing Item List</h2>
            <nav className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600 md:mt-0">
             <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/marketingitem/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Marketing Item List
                          </NavLink>    
            </nav>
          </header>
          {view && <ItemsImageView setView={setView} data={data} />}
          {/* Filters Section */}
          <div className="p-4 mb-4 bg-white border-t-4 rounded shadow border-cyan-500">
            <div className="flex flex-col items-center justify-between mb-4 md:flex-row md:items-center">
              <h3 className="text-lg font-semibold">Marketing Item List</h3>
              <button className="px-4 py-1 mt-2 text-white rounded bg-cyan-400 hover:bg-cyan-600 md:mt-0" onClick={() => navigate('/marketingitem/add')}>
                + Create Marketing Item
              </button>
            </div>

            
            <div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
                <div className='w-full md:w-1/2'>    
                 <div className='w-full'>
                    <label htmlFor="">Type</label>
                <Select className='w-full' options={Type} onChange={(option)=>setSelectedType(option.value)}/>
                 </div>
                </div>

                <div className='flex flex-col items-baseline gap-2 md:flex-row'>
                <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={handleEntriesChange}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              
              <div className="flex flex-col gap-2 md:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2'>
                <button 
                // onClick={handleCopy}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button 
                // onClick={handleExcelDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button
                //  onClick={handlePdfDownload}
                  className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button 
                // onClick={handlePrint}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button 
                // onClick={handleCsvDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
                </div>
             

              
            </div>
            

            {/* Advance Payments Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full bg-white border-collapse rounded-md shadow-lg">
                <thead className="text-sm bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">ItemName</th>
                    
                    <th className="px-4 py-2 border">Total Sold</th>
                    <th className="px-4 py-2 border">Purchase Price </th>
                    
                    <th className="px-4 py-2 border">Price Without Tax</th>
                    <th className="px-4 py-2 border">SalesPrice</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-sm text-center text-gray-500">No data available in table</td>
                    </tr>
                  ) : (
                    currentUsers.map((transfer) => (
                      <tr key={transfer._id} className="border-t">
                        <td className="px-4 py-2 border">{transfer._id}</td>
                        <td className="px-4 py-2 border">{new Date(transfer.createdAt).toDateString()}</td>
                        <td className="px-4 py-2 border">{transfer.type}</td>
                        <td className="px-4 py-2 border">{transfer.item?.itemName || "NA"}</td>
                        <td className="px-4 py-2 border">{transfer.totalSold || "NA"}</td>
                        <td className="px-4 py-2 border">{transfer.item?.purchasePrice || "NA"}</td>
                        <td className="px-4 py-2 border">{transfer.item?.purchasePrice || "NA"}</td>
                        <td className="px-4 py-2 border">{transfer.item?.purchasePrice || "NA"}</td>
                        
                       
                      <td className="relative px-4 py-2 border">
  <button
    className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-cyan-600 rounded hover:bg-cyan-700 transition-colors"
    onClick={() => toggleDropdown(transfer._id)}
  >
    Action <span className="text-xs">▼</span>
  </button>

  {dropdownIndex === transfer._id && (
    <div className="absolute right-0 z-20 mt-2 bg-white border border-gray-200 shadow-lg w-44 rounded-xl animate-fadeIn">
      
     
      <button
        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-blue-600 transition-colors rounded-t-xl hover:bg-blue-50"
        onClick={() => {
          navigate(`/marketingitem/add?id=${transfer._id}`)
        }}
      >
        <FaEye />
        Edit
      </button>

      <button
        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 transition-colors rounded-b-xl hover:bg-red-50"
        onClick={() => handleDelete(transfer._id)}
      >
        <FaTrash />
        Delete
      </button>
    </div>
  )}
</td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
              <span>                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries</span>              </span>
              <div className='flex justify-between w-full md:w-auto md:gap-2'>
              <button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
    ${currentPage === 1 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
  Previous
</button>

<button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md 
    ${currentPage === totalPages 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
>
  Next
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</button>

              </div>
            </div>
          </div>
        </div> 
      </div>
    </div>
  );
};


export default MarketingItemView;