import React, { useState,useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt,FaEdit,FaTrash } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { useNavigate } from 'react-router-dom';
const ExpenseCategoryList = () => {
  const navigate = useNavigate();
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [expenses,setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    // at top of component
const [localPermissions, setLocalPermissions] = useState([]);
useEffect(() => {
  const stored = localStorage.getItem("permissions");
  if (stored) setLocalPermissions(JSON.parse(stored));
}, []);
function hasPermissionFor(module, action) {
  const role = (localStorage.getItem("role") || "guest").toLowerCase();
  if (role === "admin") return true;
  return localPermissions.some(p =>
    p.module.toLowerCase() === module.toLowerCase() &&
    p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
  );
}

  const[searchTerm,setSearchTerm]=useState("")
  const[dropdownIndex,setDropdownIndex]=useState(null)
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const fetchExpenses = async () => {
    try {
        setLoading(true)
      const token = localStorage.getItem("token");
      const response = await axios.get(`api/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data)
      setExpenses(response.data.data)
     
    } catch (err) {
      console.log(err.message);
    } 
    finally{
        setLoading(false)
    }
  };
 useEffect(()=>{fetchExpenses()},[])

 const filteredData = expenses.filter(item => 
    // item.customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category?.name|| "".toLowerCase().includes(searchTerm.toLowerCase()) 
  );
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);
  
  const handlePageChange = (newPage) =>  {
    if(newPage >=1 && newPage <=totalPages )
    setCurrentPage(newPage);
  }
  const handleEntriesChange=(e)=>{
    setEntriesPerPage(Number(e.target.value))
    setCurrentPage(1)
  }
  
    const handleCopy = () => {
        const data = expenses.map(exp => `${exp.category?.name||"NA"}, ${exp.note}, ${exp.status}`).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
    };

    const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(expenses);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expensescategory");
        XLSX.writeFile(wb, "expenses_category.xlsx");
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Expense Category List", 20, 20);
        const tableData = expenses.map(exp => [exp.category?.name || "NA", exp.note, exp.status]);
        autoTable(doc, {
            head: [['Category', 'Description', 'Status']],
            body: tableData,
        });
        doc.save('expensescategory.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + expenses.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "expenses_category.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
   
    

    const updateData = async (id, newStatus) => {
        setLoading(true);
        
        try {
          const response = await axios.put(
            `api/expenses/${id}`,
             newStatus , // ✅ Send status as an object
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // ✅ Prevent null token issues
              },
            }
          );
      
          
          alert("Update Successfully");
      
         fetchExpenses(); // Fetch updated data after successful update
      
        } catch (err) {
          console.error("Error:", err.response?.data || err.message);
          alert("Unsuccessful: " + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
    }
    const handleDelete = async (id) => {
        const conf= window.confirm("Do u want to delete this")
        if(!conf){
          return ;
        }
        setLoading(true)
       
        try {
          const response = await axios.delete(`api/expenses/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
        
         alert("Deleted Successfully")
        
        } catch (error) {
          console.error( error.message);
        }
        finally{
          await fetchExpenses();
          setLoading(false)
        }
      };     

        
        const [update, setUpdate] = useState(null);
        const handleStatus = (id) => {
          const selectedCategory = expenses.find((item) => item._id === id);
        
          if (!selectedCategory) {
            console.error("Category not found for ID:", id);
            return;
          }
        
          // ✅ Create updated object immediately
          const newStatus = selectedCategory.status === "Active" ? "Inactive" : "Active";
          const updatedCategory = { ...selectedCategory, status: newStatus };
        
        
          // ✅ Call API with the updated data immediately
          updateData(id, updatedCategory);
        
          // ✅ Update local state immediately (for UI consistency)
          setUpdate(updatedCategory);
        };


    if (loading) {
        return <LoadingScreen />; // Show loading screen while fetching data
    }
    return (
<div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                
              {/* Sidebar component with open state */}
              <div className='w-auto'>
                
              <Sidebar isSidebarOpen={isSidebarOpen} />
              </div>
                
                 {/* Content */}
         <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>

            <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
                <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:text-left">
                    <h1 className="text-lg font-semibold truncate sm:text-xl">Expense Category List</h1>
                </div>
                <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                    <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
                    <BiChevronRight className="mx-1 sm:mx-2" />
                    <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Expense Category List</a>
                </nav>
            </header>

            <div className="p-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
                <header className="flex items-center justify-between mb-4">
                    <div></div>
                    {hasPermissionFor("ExpenseCategories","Add") && (
                    <button className="px-4 py-2 text-white rounded bg-cyan-500" onClick={()=>navigate('/add-expense-category')}>+ New Expense</button>
                    )}
                </header>

                <div className="flex flex-col justify-between w-full mt-4 mb-4 space-y-2 lg:flex-row lg:space-y-0 lg:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage}   onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}>
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col justify-around w-full gap-2 lg:flex-row">
                <div className='flex items-center justify-around flex-1 w-full gap-1 px-2'>
                <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm md:w-auto" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-sm text-center border">Category</th>
                                <th className="px-3 py-2 text-sm text-center border">Description</th>
                                <th className="px-3 py-2 text-sm text-center border">Status</th>
                                <th className="px-3 py-2 text-sm text-center border">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            { currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center">No data available in table</td>
                                </tr>
                            ) : (
                                currentUsers.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-gray-100">
                                        <td className="px-3 py-2 text-sm text-center border">{expense.category?expense.category.name:"No category"}</td>
                                        <td className="px-3 py-2 text-sm text-center border">{expense.note}</td>
                                        <td className="px-3 py-2 text-sm text-center border" onClick={()=>handleStatus(expense._id)}>
                                        {expense.status.toLowerCase()==='active'?<span className="px-1 py-1 text-sm text-white bg-green-600 rounded-md">Active</span>:<span className="px-1 py-1 text-sm text-white bg-red-600 rounded-md">Inactive</span>}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-center border">
<button
      onClick={() => {
        setDropdownIndex(dropdownIndex === expense._id ? null : expense._id);
      }}
      className="px-3 py-1 text-white transition rounded bg-cyan-600 hover:bg-cyan-700"
    >
      Action ▼
    </button>

    {dropdownIndex === expense._id && (
      <div
        // ref={dropdownRef}
        className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-36 animate-fade-in"
      >
        {hasPermissionFor("ExpenseCategories","Edit") && (
          <button
          className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
          onClick={() => navigate(`/add-expense-category?id=${expense._id}`)}
        >
          <FaEdit className="mr-2" /> Edit
        </button>
        )}
        {hasPermissionFor("ExpenseCategories","Delete") && (
        <button
          className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
          onClick={() => handleDelete(expense._id)}
        >
          <FaTrash className="mr-2" /> Delete
        </button>
        )}
      </div>
    )}                                          </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, expenses.length)} of {expenses.length} entries</span>
                    <div>
                        <button onClick={handlePageChange} className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>
                            Previous
                        </button>
                        <button onClick={handlePageChange} className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>
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

export default ExpenseCategoryList;