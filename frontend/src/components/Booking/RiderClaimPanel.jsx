import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheck } from 'react-icons/fa';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

const api = axios.create({ baseURL: '/vps/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default function RiderJobsPanel() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [jobs, setJobs]                 = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  // 1) Fetch assigned jobs on mount
  useEffect(() => {
    setLoading(true);
    api.get('/bookings/assigned')
      .then(res => {
        setJobs(res.data.data);
        setError(null);
      })
      .catch(() => setError('Failed to load your assigned jobs'))
      .finally(() => setLoading(false));
  }, []);

  // 2) Claim a job
  const handleClaim = async (id) => {
    try {
      await api.patch(`/bookings/${id}/claim`, {});
      // remove from list
      setJobs(js => js.filter(j => j._id !== id));
    } catch (err) {
      alert('Claim failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <h1 className="text-2xl font-semibold mb-4">Your Assigned Jobs</h1>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
          )}
          {loading ? (
            <div>Loading…</div>
          ) : jobs.length === 0 ? (
            <div className="text-gray-600">No jobs assigned to your van.</div>
          ) : (
            <div className="space-y-4">
              {jobs.map(j => (
                <div key={j._id} className="bg-white p-4 rounded shadow">
                  <div className="text-gray-800 mb-1">
                    <strong>Customer:</strong> {j.customer.name} ({j.customer.phone})
                  </div>
                  <div className="text-gray-700 mb-1">
                    <strong>Pickup:</strong> {j.pickupAddress.street}, {j.pickupAddress.area}, {j.pickupAddress.city}
                  </div>
                  <div className="text-gray-700 mb-1">
                    <strong>When:</strong>{' '}
                    {j.type === 'scheduled'
                      ? new Date(j.scheduledFor).toLocaleString()
                      : 'ASAP'}
                  </div>
                  <div className="text-gray-700 mb-4">
                    <strong>Remark:</strong> {j.remark || <em>none</em>}
                  </div>
                  <button
                    onClick={() => handleClaim(j._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                  >
                    <FaCheck /> Claim
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
