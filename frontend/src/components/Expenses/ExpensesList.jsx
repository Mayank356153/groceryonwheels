import React, { useEffect, useState } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt ,FaEdit,FaTrash } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from '../../Loading.jsx';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const ExpenseList = () => {
    const navigate = useNavigate()
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const[searchTerm,setSearchTerm]=useState("")
    const [currentPage, setCurrentPage] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [expenses,setExpenses] = useState([]);
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

  const[loading,setLoading]=useState(true)
    const[dropdownIndex,setDropdownIndex]=useState(null)
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[])
    const filteredData = expenses.filter(item => 
        // item.customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.category?.name ||"").toLowerCase().includes(searchTerm.toLowerCase()) 
    );
    const indexOfLastItem = currentPage * entriesPerPage;
    const indexOfFirstItem = indexOfLastItem - entriesPerPage;
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const currentUsers = filteredData.slice((currentPage-1)*entriesPerPage, currentPage* entriesPerPage);
    const totalAmount = currentUsers.reduce((total, exp) => total + exp.amount, 0).toFixed(2);
    
      const handlePageChange = (newPage) =>  {
        if(newPage >=1 && newPage <=totalPages )
        setCurrentPage(newPage);
      }
      const handleEntriesChange=(e)=>{
        setEntriesPerPage(Number(e.target.value))
        setCurrentPage(1)
      }

    const handleCopy = () => {
        const data = currentUsers.map(exp => `${exp.date}, ${exp.category?.name || "No Category"}, ${exp.referenceNO || "NA"}, ${exp.expenseFor}, ${exp.amount}, ${exp.account}, ${exp.note}, ${exp.createdBy}`).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
    };

    const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(expenses);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, "expenses.xlsx");
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Expenses List", 20, 20);
        const tableData = expenses.map(exp => [exp.date, exp.category?.name || "NA", exp.referenceNo, exp.expenseFor, exp.amount, exp.account ||"NA", exp.note, exp.createdBy]);
        autoTable(doc, {
            head: [['Date', 'Category', 'Reference No.', 'Expense for', 'Amount', 'Account', 'Note', 'Created by']],
            body: tableData,
        });
        doc.save('expenses.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + expenses.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "expenses.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handledelete = async (e,id) => {
        e.preventDefault();
        const conf = window.confirm("Do you want to delete this supplier?");
        if (!conf) return;
        
        try {
            setLoading(true)
            const response = await fetch(`api/expenses/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
      
            if (!response.ok) {
                throw new Error("Failed to delete expense");
            }
      
            console.log("Expense deleted successfully!");
             fetchExpenses();
            // // Update state without fetching again
            // setUsers((prevUsers) => prevUsers.filter(user => user._id !== id));
      
        } catch (error) {
            console.error("Error deleting purchase:", error.message);
        }
        finally {
            setLoading(false)
        }
    
      };
      
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
        finally {
            setLoading(false)
        }
      };
     useEffect(()=>{fetchExpenses()},[])
     if(loading) return(<LoadingScreen/>)
    return (
        <div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow mt">
          
                
              {/* Sidebar component with open state */}
              <div className="w-auto">
              <Sidebar isSidebarOpen={isSidebarOpen}/>
              </div>
                
                 {/* Content */}
         <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>

            <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
                <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                    <h1 className="text-sm font-semibold truncate sm:text-xl">Expenses List</h1>
                    <span className="text-xs text-gray-600 sm:text-sm">View/Search Expenses</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                    <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
                    <BiChevronRight className="mx-1 sm:mx-2" />
                    <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Expenses List</a>
                </nav>
            </header>

            <div className="p-4 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
                <header className="flex items-center justify-between mb-4">
                    <div></div>
                    {hasPermissionFor("Expenses","Add") && (
                    <button className="px-4 py-2 text-white rounded bg-cyan-500"onClick={()=>navigate('/add-expense')}>+ New Expense</button>
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
                                <th className="px-4 py-2 text-sm text-left border ">Date</th>
                                <th className="px-3 py-2 text-sm text-left border">Category</th>
                                <th className="px-3 py-2 text-sm text-left border">Reference No.</th>
                                <th className="px-3 py-2 text-sm text-left border">Expense for</th>
                                <th className="px-3 py-2 text-sm text-left border">Amount</th>
                                <th className="px-3 py-2 text-sm text-left border">Account</th>
                                <th className="px-3 py-2 text-sm text-left border">Note</th>
                                <th className="px-3 py-2 text-sm text-left border">Created by</th>
                                <th className="px-3 py-2 text-sm text-left border">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-4 text-center">No data available in table</td>
                                </tr>
                            ) : (
                                filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((expense) => (
                                    <tr key={expense._id} id={expense._id} className="hover:bg-gray-100">
                                        <td className="py-2 text-sm border ">{new Date(expense.date).toDateString()}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.category?.categoryName || "No category"}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.referenceNo}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.expenseFor}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.amount || 0}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.account?.accountName || "N/A"}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.note}</td>
                                        <td className="px-3 py-2 text-sm border">{expense.creatorName || "NA"}</td>
                                        <td className="px-3 py-2 text-sm border">
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
        {hasPermissionFor("Expenses","Edit") && (
          <button
          className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
          onClick={() => navigate(`/add-expense?id=${expense._id}`)}
        >
          <FaEdit className="mr-2" /> Edit
        </button>
        )}
        {hasPermissionFor("Expenses","Delete") && (
        <button
          className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
          onClick={() => handledelete(expense._id)}
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
                        <tfoot>
                            {
                                currentUsers.length > 0 && (
                                    <tr className="bg-gray-200">
                                    <td colSpan="4" className="px-4 py-2 font-bold text-right border">Total:</td>
                                    <td className="px-4 py-2 font-bold border">{totalAmount}</td>
                                    <td colSpan="4" className="px-4 py-2 border"></td>
                                </tr>
                                )
                            }
                          
                        </tfoot>
                    </table>
                </div>

                <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, expenses.length)} of {expenses.length} entries</span>
                    <div>
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>
                            Previous
                        </button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>
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

export default ExpenseList;