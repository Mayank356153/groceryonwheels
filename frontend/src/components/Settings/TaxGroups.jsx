import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const TaxGroups = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [taxGroups, setTaxGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch tax groups from /api/tax-groups
  const fetchTaxGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("api/tax-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaxGroups(res.data.data || []);
    } catch (error) {
      console.error("Error fetching tax groups:", error.message);
    }
  };

  useEffect(() => {
    fetchTaxGroups();
  }, []);

  // Client-side filter based on group name
  const filteredGroups = taxGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * entries;
  const indexOfFirstItem = indexOfLastItem - entries;
  const currentItems = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGroups.length / entries);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Export functionalities
  const handleCopy = () => {
    const data = filteredGroups
      .map(g => `${g.groupName}, [${g.taxes?.length || 0} taxes], ${g.status}`)
      .join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredGroups);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Groups");
    XLSX.writeFile(wb, "tax_groups.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Tax Groups List", 20, 20);
    const tableData = filteredGroups.map(g => [
      g.groupName,
      g.taxes?.length || 0,
      g.status,
    ]);
    autoTable(doc, {
      head: [["Group Name", "Taxes Count", "Status"]],
      body: tableData,
    });
    doc.save("tax_groups.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      filteredGroups.map(g => `${g.groupName},${g.taxes?.length || 0},${g.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tax_groups.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete a tax group
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tax group?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`api/tax-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Tax Group deleted successfully!");
      fetchTaxGroups();
    } catch (error) {
      console.error("Error deleting tax group:", error.message);
    }
  };

  // Toggle tax group status between "active" and "inactive"
  const handleToggleGroupStatus = async (groupId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `api/tax-groups/${groupId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Tax Group status updated successfully!");
      fetchTaxGroups();
    } catch (error) {
      console.error("Error toggling tax group status:", error.message);
      alert("Failed to update tax group status.");
    }
  };

  return (
    <div className="p-4 mt-6 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tax Groups List</h2>
        <button
          className="px-4 py-2 text-white rounded bg-cyan-500"
          onClick={() => navigate("/add-tax-group")}
        >
          + New Tax Group
        </button>
      </header>

      {/* Table Controls */}
      <div className="flex flex-col justify-between w-full mt-4 mb-4 space-y-2 lg:flex-row lg:space-y-0 lg:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entries}   onChange={(e) => {
                    setEntries(Number(e.target.value));
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
      <div className='overflow-x-auto'>
      {/* Table */}
      <table className="min-w-full bg-white border-collapse rounded-lg shadow-lg">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 border">Group Name</th>
            <th className="px-4 py-2 border"># of Taxes</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 text-center border">Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-4 py-2 text-center text-gray-500 border">
                No matching records found
              </td>
            </tr>
          ) : (
            currentItems.map((group) => (
              <tr key={group._id} className="border-b">
                <td className="px-4 py-2 border">{group.groupName}</td>
                <td className="px-4 py-2 border">{group.taxes?.length || 0}</td>
                <td className="px-4 py-2 border">
                  <span
                    onClick={() => handleToggleGroupStatus(group._id, group.status)}
                    className={`cursor-pointer px-2 py-1 rounded-lg ${
                      group.status === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {group.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-center border">
                  <button
                    className="px-2 py-1 mr-2 text-white rounded bg-cyan-600 hover:bg-cyan-500 focus:outline-none"
                    onClick={() => navigate(`/edit-tax-group/${group._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-500 focus:outline-none"
                    onClick={() => handleDelete(group._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
       </div>
      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <div>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredGroups.length)} of {filteredGroups.length} entries
        </div>
        <div>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 mr-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastItem >= filteredGroups.length}
            className="px-2 py-1 ml-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxGroups;
