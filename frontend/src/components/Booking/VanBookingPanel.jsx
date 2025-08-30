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

export default function AdminAssignPanel() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings]       = useState([]);
  const [vans, setVans]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [vanIds, setVanIds]           = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/bookings/pending'),
      api.get('/warehouses')
    ])
      .then(([bRes, wRes]) => {
        setBookings(bRes.data.data);
        // POS uses either data.data or data.warehouses
        const list = wRes.data.data || wRes.data.warehouses || [];
        setVans(list);
        setError(null);
      })
      .catch(() => setError('Failed to load bookings or vans'))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async (bookingId) => {
    const vanId = vanIds[bookingId];
    if (!vanId) {
      return alert('Please select a van before assigning.');
    }
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { vanId });
      setBookings(bs => bs.filter(b => b._id !== bookingId));
    } catch (err) {
      alert('Assign failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <h1 className="text-2xl font-semibold mb-4">Assign Vans to Bookings</h1>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div>Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="text-gray-600">No pending bookings.</div>
          ) : (
            <div className="space-y-4">
              {bookings.map(b => (
                <div key={b._id} className="bg-white p-4 rounded shadow">
                  <div className="mb-2 text-gray-800">
                    <strong>Customer:</strong> {b.customer.name} ({b.customer.phone})
                  </div>
                  <div className="mb-2 text-gray-700">
                    <strong>Pickup:</strong>{' '}
                    {b.pickupAddress.street}, {b.pickupAddress.area}, {b.pickupAddress.city}
                  </div>
                  <div className="mb-2 text-gray-700">
                    <strong>Type:</strong> {b.type}
                    {b.type === 'scheduled' && (
                      <span className="ml-4">
                        <strong>When:</strong>{' '}
                        {new Date(b.scheduledFor).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="mb-4 text-gray-700">
                    <strong>Remark:</strong> {b.remark || <em>none</em>}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded"
                      value={vanIds[b._id] || ''}
                      onChange={e =>
                        setVanIds(m => ({ ...m, [b._id]: e.target.value }))
                      }
                    >
                      <option value="">Select a van…</option>
                      {vans.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.warehouseName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(b._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                    >
                      <FaCheck /> Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
