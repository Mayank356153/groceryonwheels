import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";

export default function DeletionRequests() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Fetch the pending deletion requests
  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "api/deletion-requests?status=PENDING",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      setList(data.data || []);
    } catch (err) {
      console.error("Failed to fetch deletion requests:", err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run fetchList once on mount
  useEffect(() => {
    fetchList();
  }, []);

  // Approve or reject a request
  const act = async (id, approve) => {
    setLoading(true);
    try {
      const url =
        `api/deletion-requests/${id}` +
        (approve ? "/approve" : "/reject");
      await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      await fetchList();
    } catch (err) {
      console.error(`Failed to ${approve ? "approve" : "reject"} request:`, err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading…</p>
      </div>
    );
  }

  
    return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
      <div className="p-3 container-fluid">
    
      <h1 className="text-lg font-bold mb-3">Pending Deletion Requests</h1>
      <table className="min-w-full text-sm border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th>Request ID</th>
     <th>Warehouse</th>
     <th>Requested By</th>
     <th>Reason</th>
            <th className="border px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r._id} className="hover:bg-gray-50">
             <td>{r._id}</td>
       <td>{r.itemId?.warehouseName || r.itemId?._id}</td>
       <td className="border px-2 py-1">
       {r.requestedBy
         ? `${r.requestedBy.FirstName} ${r.requestedBy.LastName}`  // full name
         : "—"}
     </td>
       <td>{r.reason || "—"}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => act(r._id, true)}
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(r._id, false)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center p-4">
                No pending requests.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
    </div>
  );
}
