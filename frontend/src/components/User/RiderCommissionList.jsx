import React, { useEffect, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { FaTachometerAlt } from 'react-icons/fa';
import LoadingScreen from "../../Loading";
import axios from "axios";
import MoneyBreakdownTable from "./MoneyBreakdownTable"

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
const RiderCommissionList = () => {
  const [loading, setLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [status, setStatus] = useState([]);
  const [users, setUsers] = useState([]); // User state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [permissions, setPermissions] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const[data,setData]=useState([])
  const[view,setView]=useState(false)
  // load sidebar open/closed
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // load permissions
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    setPermissions(stored ? JSON.parse(stored) : []);
  }, []);

  const fetchusers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch("api/rider-commission/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
        
      // unwrap into a flat array
      const all = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : [];
         console.log(all)
      // **now just use what the backend sent you**
      setUsers(all);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ?")) return;
    setLoading(true);
    try {
      await axios.delete(`api/rider-commission/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchusers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchusers();
  }, []);

  // filtering & paging
 const filtered = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
        u.storeId?.StoreName?.toLowerCase().includes(term) ||
        u.storeId?.Email?.toLowerCase().includes(term) ||
        u.storeId?.StoreCode?.toLowerCase().includes(term)
    );
});
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(start, start + itemsPerPage);

  const exportToExcel = () => {
    const data = current.flatMap((item, index) => {
      const baseData = {
        '#': index + 1,
        'Store Name': item.storeId?.StoreName || 'N/A',
        'Total Amount': item.totalAmount?.toLocaleString() || '0',
      };

      // If no breakdown, return just the base data
      if (!item.moneyBreakdown?.length) {
        return [baseData];
      }

      // Add breakdown items
      return item.moneyBreakdown.map((breakdown, i) => ({
        ...baseData,
        'Breakdown #': i + 1,
        'Reason': breakdown.reason,
        'Amount': breakdown.amount,
        'Store Name': i === 0 ? baseData['Store Name'] : '', // Only show store name once per group
        'Total Amount': i === 0 ? baseData['Total Amount'] : '' // Only show total once per group
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Add merged cells for store name and total amount
    if (current.some(item => item.moneyBreakdown?.length > 1)) {
      worksheet['!merges'] = [
        // Add merges for store name and total amount columns
        // This makes Excel display them only once per group
      ];
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rider Commissions');
    XLSX.writeFile(workbook, 'RiderCommissions.xlsx');
  };

  // Enhanced PDF export with breakdown
 const exportToPDF = () => {
  const doc = new jsPDF();
  let startY = 15;
  
  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Rider Commissions Report', 14, startY);
  startY += 10;

  current.forEach((item, index) => {
    // Commission header
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${index + 1} - ${item.storeId?.StoreName || 'N/A'}`, 14, startY);
    doc.text(`Total: ${item.totalAmount?.toLocaleString() || '0'}`, 100, startY);
    startY += 8;

    // Breakdown table
    if (item.moneyBreakdown?.length) {
      const breakdownColumns = ["#", "Reason", "Amount"];
      const breakdownRows = item.moneyBreakdown.map((b, i) => [
        i + 1,
        b.reason,
        b.amount?.toLocaleString() || '0'
      ]);

      autoTable(doc, {
        head: [breakdownColumns],
        body: breakdownRows,
        startY,
        margin: { left: 14 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [55, 65, 81],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      startY = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('No breakdown available', 14, startY);
      startY += 10;
    }

    // Add space between commissions
    startY += 5;
  });

  doc.save('RiderCommissions.pdf');
};


const exportToCSV = () => {
  // Create CSV header
  let csvContent = "Store Name,Total Amount,Reason,Amount\n";
  
  current.forEach((item) => {
    const storeName = item.storeId?.StoreName || 'N/A';
    const totalAmount = item.totalAmount?.toLocaleString() || '0';
    
    if (item.moneyBreakdown?.length) {
      item.moneyBreakdown.forEach((breakdown) => {
        csvContent += `"${storeName}","${totalAmount}","${breakdown.reason || ''}","${breakdown.amount || '0'}"\n`;
      });
    } else {
      csvContent += `"${storeName}","${totalAmount}","No breakdown","0"\n`;
    }
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'RiderCommissions.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  
const handlePrint = () => {
        window.print();
    };

    
     
const copyToClipboard = async () => {
  // Format data for clipboard
  let clipboardText = "Rider Commissions Report\n\n";
  
  current.forEach((item, index) => {
    clipboardText += `#${index + 1} - ${item.storeId?.StoreName || 'N/A'}\n`;
    clipboardText += `Total: ${item.totalAmount?.toLocaleString() || '0'}\n`;
    
    if (item.moneyBreakdown?.length) {
      clipboardText += "Breakdown:\n";
      item.moneyBreakdown.forEach((breakdown, i) => {
        clipboardText += `${i + 1}. ${breakdown.reason || ''}: ${breakdown.amount || '0'}\n`;
      });
    } else {
      clipboardText += "No breakdown available\n";
    }
    
    clipboardText += "\n";
  });

  try {
    await navigator.clipboard.writeText(clipboardText);
    alert('Commission data copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = clipboardText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Commission data copied to clipboard!');
  }
};

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col ">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="box-border flex min-h-screen">
        <div className='w-auto'>
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        
        <div className="flex flex-col w-full p-2 mx-auto overflow-x-auto transition-all duration-300">
          <header className="flex flex-col items-center justify-start px-2 py-2 mb-2 bg-gray-100 rounded-md shadow md:justify-between md:flex-row">
            <div className="flex items-baseline gap-2 sm:text-left">
              <h1 className="text-lg font-semibold">Rider Commission List</h1>
              <span className="hidden text-xs text-gray-600 md:inline">View/Search Riders Commission List</span>
            </div>
            <nav className="flex gap-2 text-xs text-gray-500">
              <NavLink to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-gray-800">
                <FaTachometerAlt /> Home
              </NavLink>
              <NavLink to="/rider-commission/view" className="text-gray-500 no-underline hover:text-gray-800">
                &gt; Riders Commission List
              </NavLink>
            </nav>
          </header>
          {
            view && 
             <MoneyBreakdownTable 
        breakdownData={data} 
        title="Commission Breakdown"
        showTotal={true}
        onClose={()=>setView(false)}
      />
          }

          <div className="p-4 bg-white border rounded-lg shadow-md">
            <header className="flex flex-col items-center justify-between mb-4 md:flex-row">
              <div className='hidden md:inline'>Riders Commission  List</div>
              <Link to='/rider-commission/create'>
                <button className="px-4 py-2 text-white rounded bg-cyan-500">+ New Rider Commission</button>
              </Link>
            </header>

            {/* controls */}
            <div className="flex flex-col justify-between mb-2 space-y-1 md:flex-row md:space-y-0 md:items-center">
                            <div className="flex items-center w-full space-x-2">
                                <span className="text-sm">Show</span>
                                <select className="p-2 text-sm border border-gray-300" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                                    <option>10</option>
                                    <option>20</option>
                                    <option>50</option>
                                </select>
                                <span className="text-sm">Entries</span>
                            </div>
                            
                            <div className="flex justify-end flex-1 gap-1 mt-2 mb-2 ">
                            <button onClick={copyToClipboard} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Copy</button>
                <button onClick={exportToExcel} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Excel</button>
                <button onClick={exportToPDF} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Print</button>
                <button onClick={exportToCSV} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">CSV</button>
                                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 md:w-auto" onChange={(e)=>setSearchTerm(e.target.value)}/>
                            </div>
         </div>

           {/* <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
    
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {["#", "Store Name",  "Total Amount", "Actions"].map((header) => (
            <th
              key={header}
              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {current.length === 0 ? (
          <tr>
            <td colSpan="5" className="px-6 py-4 text-sm text-center text-gray-500">
              No data available
            </td>
          </tr>
        ) : (
          current.map((u, i) => (
            <tr key={u._id} className="transition-colors hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {i + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {u.storeId?.StoreName}
                </div>
              </td>
              
              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {u.totalAmount?.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                <div className="flex space-x-2">
                  <button
                    onClick={() =>{
                        setData(u.moneyBreakdown)
                        setView(true)
                    }}
                    className="px-2 py-1 text-blue-600 transition-colors rounded hover:text-blue-900 hover:bg-blue-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/rider-commission/create?id=${u._id}`)}
                    className="px-2 py-1 text-indigo-600 transition-colors rounded hover:text-indigo-900 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="px-2 py-1 text-red-600 transition-colors rounded hover:text-red-900 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

</div> */}
<div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50/80 backdrop-blur-sm">
        <tr>
          {["#", "Store", "Total", "Actions"].map((header) => (
            <th
              key={header}
              className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                header === "Actions" ? "text-right" : ""
              }`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {current.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-500">No commissions found</p>
                <p className="text-xs text-gray-400">Add a new commission to get started</p>
              </div>
            </td>
          </tr>
        ) : (
          current.map((u, i) => (
            <tr
              key={u._id}
              className="transition-all hover:bg-gray-50/50 even:bg-gray-50/30"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {i + 1}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {u.storeId?.StoreName || "Unnamed Store"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {u.storeId?.StoreCode || ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                {u.totalAmount}
                </div>
                {u.moneyBreakdown?.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {u.moneyBreakdown.length} reasons
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      setData(u.moneyBreakdown);
                      setView(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View breakdown"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigate(`/rider-commission/create?id=${u._id}`)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="Edit"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

            {/* pagination */}
            <div className="flex flex-col items-center gap-2 p-2 md:flex-row md:justify-between">
              <span>
                Showing {start+1} to {Math.min(start+itemsPerPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded ${currentPage===1 ? "bg-gray-300" : "bg-blue-500 text-white"}`}
                  disabled={currentPage===1}
                  onClick={() => setCurrentPage(p => p-1)}
                >
                  Previous
                </button>
                <button
                  className={`px-3 py-1 rounded ${currentPage===totalPages ? "bg-gray-300" : "bg-blue-500 text-white"}`}
                  disabled={currentPage===totalPages}
                  onClick={() => setCurrentPage(p => p+1)}
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

export default RiderCommissionList;
