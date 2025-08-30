import React, { useState,useEffect } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaEdit, FaTrash } from "react-icons/fa";
import  {Link} from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../Loading";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios from "axios";


const BrandsList = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const[loading,setLoading]=useState([])
  const[brands,setBrands]=useState([])
  const Navigate=useNavigate()
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
 
  const fetchBrands = async () => {
    setLoading(true)
    try {
      const response = await axios.get('api/brands', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
  
    console.log(response.data)
     setBrands(response.data.data) 
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{
    fetchBrands()
  },[])

   
const filteredData = 
brands.filter(item => 
  item.brandName.toLowerCase().includes(searchTerm.toLowerCase()) 
);

 
const indexOfLastItem = currentPage * entriesPerPage;
const indexOfFirstItem = indexOfLastItem - entriesPerPage;
const totalPages = Math.ceil(filteredData.length / entriesPerPage);
const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

     const handleCopy = () => {
        const data = currentUsers.map(item => `${item.brandName},${item.description},${item.status}`).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
      };
    
      const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(currentUsers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Brands");
        XLSX.writeFile(wb, "Brands.xlsx");
      };

      
        const handlePdfDownload = () => {
          const doc = new jsPDF();
          doc.text("Brands List", 20, 20);
          const tableData = filteredData.map(item => [
           item.brandName,
           item.description,
           item.status
          ]);
      
          autoTable(doc, {
            head: [['Brand Name','Description','Status']],
            body: tableData,
          });
      
          doc.save("Brands_list.pdf");
        };
      
        const handlePrint = () => {
          window.print();
        };

        const handleCsvDownload = () => {
          const csvContent = "data:text/csv;charset=utf-8," + currentUsers.map(user => Object.values(user).join(",")).join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "customers.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
    const toggleDropdown = (index) => {
      setDropdownIndex(dropdownIndex === index ? null : index);
    };
    const updateData = async (id, update) => {
      setLoading(true);
      
      try {
        const response = await axios.put(
          `api/brands/${id}`,
           update , // ✅ Send status as an object
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // ✅ Prevent null token issues
            },
          }
        );
    
        
        alert("Update Successfully");
    
        fetchBrands();
    
      } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        alert("Unsuccessful: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    
    const handleDelete = async (id) => {
      const conf= window.confirm("Do u want to delete this")
      if(!conf){
        return ;
      }
      setLoading(true)
     
      try {
        const response = await axios.delete(`api/brands/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      
       alert("Deleted Successfully")
      
      } catch (error) {
        console.error( error.message);
      }
      finally{
        fetchBrands();
        setLoading(false)
      }
    };  
const [update, setUpdate] = useState(null);
const handleStatus = (id) => {
  const selectedBrand = brands.find((item) => item._id === id);

  if (!selectedBrand) {
    console.error("BRand not found for ID:", id);
    return;
  }

  // ✅ Create updated object immediately
  const newStatus = selectedBrand.status === "Active" ? "Inactive" : "Active";
  const updatedBrand = { ...selectedBrand, status: newStatus };


  // ✅ Call API with the updated data immediately
  updateData(id, updatedBrand);

  // ✅ Update local state immediately (for UI consistency)
  setUpdate(updatedBrand);
};
if(loading) return(<LoadingScreen/>)
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-col flex-grow md:flex-row">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div
          className={`flex-grow p-6  transition-all duration-300 bg-gray-100 min-h-screen`}
        >
          <header className="flex flex-col items-center justify-between mb-6 md:flex-row">
           
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                   <h1 className="text-lg font-semibold truncate sm:text-xl">Brands List</h1>
                   <span className="text-xs text-gray-600 sm:text-sm">View/Search Items Brand</span>
                 </div>
            <nav className="flex flex-wrap mt-2 text-sm text-gray-600">
              <a href="/dashboard" className="flex items-center text-gray-400 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500" /> Home
              </a>
              <BiChevronRight className="mx-2 text-gray-400 mt-1.5" />
              <a href="#" className="text-gray-400 no-underline hover:text-cyan-600">Brands List</a>
            </nav>
          </header>

          <div className="p-4 bg-white rounded shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Brands List</h2>
              <Link to='/brand-form'>
              <button className="px-4 py-2 text-white rounded bg-cyan-500">+ Create Brand</button>
              </Link>
            </div>

                        {/* Table Controls */}
           <div className="flex flex-col items-start justify-between gap-4 p-2 mb-4 md:flex-row md:items-center">
              <div className="flex items-center space-x-2">
                <label>Show</label>
                <select
                  className="w-full px-2 py-1 text-sm border rounded md:w-auto"
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <label>Entries</label>
              </div>
              <div className="flex flex-wrap gap-0.5 text-sm">
                <button className="text-white bg-cyan-300 w-14 hover:bg-cyan-500"onClick={handleCopy}>Copy</button>
                <button className="text-white bg-cyan-300 w-14 hover:bg-cyan-500"onClick={handleExcelDownload}>Excel</button>
                <button className="text-white bg-cyan-300 w-14 hover:bg-cyan-500"onClick={handlePdfDownload}>PDF</button>
                <button className="text-white bg-cyan-300 w-14 hover:bg-cyan-500"onClick={handlePrint}>Print</button>
                <button className="text-white bg-cyan-300 w-14 hover:bg-cyan-500"onClick={handleCsvDownload}>CSV</button>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full px-2 py-1 border rounded md:w-auto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-center border border-collapse border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border"><input type="checkbox" /></th>
                  <th className="p-2 border">Brand Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((brand, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-1 text-center border"><input type="checkbox" /></td>
                    <td className="p-1 border">{brand.brandName}</td>
                    <td className="p-1 border">{brand.description}</td>
                    <td className="p-1 border"onClick={()=>handleStatus(brand._id)}>
                      {brand.status.toLowerCase()==='active'?<span className="px-1 py-1 text-sm text-white bg-green-600 rounded-md">Active</span>:<span className="px-1 py-1 text-sm text-white bg-red-600 rounded-md">Inactive</span>} 
                    </td>
                    <td className="relative p-2 border">
                      <button onClick={() => toggleDropdown(brand._id)} className="px-4 py-1 text-white rounded bg-cyan-600">Action ▼</button>
                      {dropdownIndex ===brand._id  && (
                        <div className="absolute z-10 p-1 bg-white border rounded shadow-md right-10">
                          <button className="flex items-center w-full px-2 py-1 hover:bg-gray-100"onClick={()=>Navigate(`/brand-form?id=${brand._id}`)}>
                            <FaEdit className="mr-2 text-blue-600" /> Edit
                          </button>
                          <button className="flex items-center w-full px-2 py-1 hover:bg-gray-100"onClick={()=>handleDelete(brand._id)}>
                            <FaTrash className="mr-2 text-red-600" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
            <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
              <p className="text-sm">Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, brands.length)} of {brands.length} entries</p>
              <div className="flex gap-1">
                <button
                  className={`px-2 py-1 rounded ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                {/* <span className="px-3 py-1 text-white bg-blue-500 rounded">{currentPage}</span> */}
                <button
                  className={`px-2 py-1 rounded ${currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsList;