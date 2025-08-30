import React, { useEffect, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { FaTachometerAlt } from 'react-icons/fa';
import LoadingScreen from "../../Loading";
import axios from "axios";
import RiderImagesView from "./RiderImagesView"
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const RiderList = () => {
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
      const response = await fetch("/api/rider/all", {
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
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/rider/${id}`, {
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
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
});
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const current = filtered.slice(start, start + itemsPerPage);

  
// Excel Export
const exportToExcel = () => {
  const data = current.map(user => ({
    '#': start + current.indexOf(user) + 1,
    'Store Name': Array.isArray(user.store) 
      ? user.store.map(s => s.StoreName).join(", ") 
      : user.store?.StoreName ?? "N/A",
    'Username': user.username,
    'Name': `${user.firstname} ${user.lastname}`,
    'Mobile': user.mobile,
    'Email': user.email,
    'Role': user.role?.roleName,
    'Created On': new Date(user.createdAt).toDateString(),
    'Status': status.includes(user._id) ? 'Inactive' : 'Active'
  }));

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Users");
  writeFile(workbook, "users_data.xlsx");
};

// PDF Export
const exportToPDF = () => {
  const doc = new jsPDF();
  
  // Title
  doc.text("Riders Report", 14, 15);
  
  // Table data
  const data = current.map(user => [
    start + current.indexOf(user) + 1,
    Array.isArray(user.store) 
      ? user.store.map(s => s.StoreName).join(", ") 
      : user.store?.StoreName ?? "N/A",
    user.username,
    `${user.firstname} ${user.lastname}`,
    user.mobile,
    user.email,
    user.role?.roleName,
    new Date(user.createdAt).toDateString(),
    status.includes(user._id) ? 'Inactive' : 'Active'
  ]);

  // Table headers
  const headers = [
    "#", "Store Name", "Username", "Name", "Mobile", 
    "Email", "Role", "Created On", "Status"
  ];

  // Generate table
  autoTable(doc,{
    head: [headers],
    body: data,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 220, 220] }
  });

  doc.save("rider_list.pdf");
};
  
const handlePrint = () => {
        window.print();
    };

    
      const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + filtered.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "roleList.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = () => {
  // Prepare headers
  const headers = [
    "#", "Store Name", "Username", "Name", "Mobile", 
    "Email", "Role", "Created On", "Status"
  ].join("\t");

  // Prepare rows
  const rows = current.map(user => [
    start + current.indexOf(user) + 1,
    Array.isArray(user.store) 
      ? user.store.map(s => s.StoreName).join(", ") 
      : user.store?.StoreName ?? "N/A",
    user.username,
    `${user.firstname} ${user.lastname}`,
    user.mobile,
    user.email,
    user.role?.roleName,
    new Date(user.createdAt).toDateString(),
    status.includes(user._id) ? 'Inactive' : 'Active'
  ].join("\t")).join("\n");

  // Combine headers and rows
  const clipboardData = `${headers}\n${rows}`;

  // Copy to clipboard
  navigator.clipboard.writeText(clipboardData)
    .then(() => {
      alert('Table data copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = clipboardData;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Table data copied to clipboard!');
    });
};
const exportToCSV = () => {
  // Prepare headers
  const headers = [
    "#", "Store Name", "Username", "Name", "Mobile", 
    "Email", "Role", "Created On", "Status"
  ];

  // Prepare rows
  const rows = current.map(user => [
    start + current.indexOf(user) + 1,
    Array.isArray(user.store) 
      ? `"${user.store.map(s => s.StoreName).join(", ")}"` 
      : user.store?.StoreName ?? "N/A",
    user.username,
    `"${user.firstname} ${user.lastname}"`,
    user.mobile,
    user.email,
    user.role?.roleName,
    new Date(user.createdAt).toDateString(),
    status.includes(user._id) ? 'Inactive' : 'Active'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'riders_data.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
              <h1 className="text-lg font-semibold">Rider List</h1>
              <span className="text-xs text-gray-600">View/Search Riders</span>
            </div>
            <nav className="flex gap-2 text-xs text-gray-500">
              <NavLink to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-gray-800">
                <FaTachometerAlt /> Home
              </NavLink>
              <NavLink to="/rider/list" className="text-gray-500 no-underline hover:text-gray-800">
                &gt; Riders List
              </NavLink>
            </nav>
          </header>
          {
            view && <RiderImagesView setView={setView} data={data}/>
          }

          <div className="p-4 bg-white border rounded-lg shadow-md">
            <header className="flex items-center justify-between mb-4">
              <div>Riders List</div>
              <Link to='/rider/add'>
                <button className="px-4 py-2 text-white rounded bg-cyan-500">+ New Rider</button>
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

            <div className="overflow-x-auto">
              <table className="w-full border border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    {["#","Store Name"," UserName","Name","Mobile","Email","Role","Created On","Images","Status","Action"]
                      .map(h => <th key={h} className="p-1 border">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {current.length === 0
                    ? <tr><td colSpan="10" className="p-2 text-center">No data Available</td></tr>
                    : current.map((u,i) => (
                      <tr key={u._id} className="text-sm">
                        <td className="p-1 border">{start + i + 1}</td>
                        <td className="p-1 border">
                          {Array.isArray(u.store)
                            ? u.store.map(s => s.StoreName).join(", ")
                            : u.store?.StoreName ?? "N/A"}
                        </td>
                        <td className="p-1 border">{u.username}</td>
                        <td className="p-1 border">{u.firstname} {u.lastname}</td>
                        <td className="p-1 border">{u.mobile}</td>
                        <td className="p-1 border">{u.email}</td>
                        <td className="p-1 border">{u.role?.roleName}</td>
                        <td className="p-1 border">{new Date(u.createdAt).toDateString()}</td>
                        <td className="p-1 border">
                          <button className='px-3 bg-gray-300 rounded-2xl' onClick={()=>{
                            setView(true);
                            setData({ProfileImage:u.profileImage,AddharCardImage:u.addharCardImage,PanCardImage:u.panCardImage,DrivingLicenseImage:u.drivingLicenseImage})
                          }}>View</button>
                        </td>
                        <td
  className="p-1 text-center transition duration-300 ease-in-out border cursor-pointer hover:bg-gray-100"
  onClick={() =>
    setStatus(st => st.includes(u._id)
      ? st.filter(x => x !== u._id)
      : [...st, u._id]
    )
  }
>
  {status.includes(u._id) ? (
    <span className="inline-block px-3 py-1 text-sm font-medium text-white transition duration-300 bg-red-600 rounded-full">
      Inactive
    </span>
  ) : (
    <span className="inline-block px-3 py-1 text-sm font-medium text-white transition duration-300 bg-green-500 rounded-full">
      Active
    </span>
  )}
</td>

<td className="relative p-1 border">
  <button
    className="px-3 py-1 text-white transition duration-300 rounded-full bg-cyan-600 hover:bg-cyan-700"
    onClick={() => setActionMenu(am => am === u._id ? null : u._id)}
  >
    Action ⏷
  </button>

  {actionMenu === u._id && (
    <div className="absolute right-0 z-10 w-32 mt-2 bg-white border rounded-md shadow-lg animate-fade-in">
      <button
        className="w-full px-3 py-2 text-sm text-left text-green-600 transition hover:bg-gray-100"
        onClick={() => navigate(`/rider/add?id=${u._id}`)}
      >
        ✏️ Edit
      </button>
      <button
        className="w-full px-3 py-2 text-sm text-left text-red-600 transition hover:bg-gray-100"
        onClick={() => deleteUser(u._id)}
      >
        🗑️ Delete
      </button>
    </div>
  )}
</td>

                      </tr>
                    ))
                  }
                </tbody>
              </table>
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

export default RiderList;
