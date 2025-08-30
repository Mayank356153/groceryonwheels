import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaLocationArrow, FaStop } from 'react-icons/fa';
import { useGeolocated } from 'react-geolocated';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import locationService from '../services/locationService';

const api = axios.create({ baseURL: '/vps/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default function MyJobsPanel() {
  /* ── UI & state ──────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState('active');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusSel, setStatusSel] = useState({});
  const [reportingId, setReportingId] = useState(locationService.getReportingId());
  const navigate = useNavigate();

  /* ── geolocation ─────────────────────── */
  const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError }
    = useGeolocated({
      positionOptions: { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      watchPosition: true, userDecisionTimeout: 5_000
    });

  /* keep service in sync with coords and resume reporting */
  useEffect(() => {
    if (coords) {
      if (locationService.getReportingId()) {
        locationService.updateCoords(coords);
        if (!locationService.isReporting(locationService.getReportingId())) {
          locationService.initialize(coords); // Ensure reporting resumes
        }
      } else {
        locationService.initialize(coords); // Resumes if needed
      }
      setReportingId(locationService.getReportingId()); // Sync state
    }
  }, [coords]);

  /* fetch jobs whenever tab changes */
  useEffect(() => {
    setLoading(true); setError(null);
    api.get(view === 'completed' ? '/bookings/my-completed-jobs' : '/bookings/my-jobs')
      .then(res => {
        console.log('Fetched jobs:', res.data.data.map(j => ({ _id: j._id, van: j.van })));
        setJobs(res.data.data);
      })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [view]);

  /* status helpers */
  const changeStatus = (id, s) => setStatusSel(p => ({ ...p, [id]: s }));
  const updateStatus = async (id) => {
    const status = statusSel[id];
    if (!status) return alert('Select status first');
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setJobs(js => js.map(j => j._id === id ? { ...j, status } : j));
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  /* live-location toggle */
  const toggleLocation = (vanId) => {
    if (locationService.isReporting(vanId)) {
      locationService.stopReporting();
      setReportingId(null);
    } else {
      if (!coords) return alert('Waiting for GPS…');
      if (!locationService.startReporting(vanId, coords)) return;
      setReportingId(vanId);
    }
  };

  /* ── render helpers ──────────────────── */
  const disableGeo = !coords || !isGeolocationAvailable || !isGeolocationEnabled;

  /* ── JSX ─────────────────────────────── */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          {/* view switch */}
          <div className="mb-4 space-x-2">
            {['active', 'completed'].map(v => (
              <button key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded ${
                  view === v
                    ? (v === 'active' ? 'bg-blue-600' : 'bg-green-600') + ' text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {v === 'active' ? 'In-Progress' : 'Completed'}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-semibold mb-4">
            {view === 'completed' ? 'My Completed Jobs' : 'My Claimed Jobs'}
          </h1>

          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
          {positionError && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            Geolocation error: {positionError.message}</div>}
          {!isGeolocationAvailable && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            Geolocation not supported.</div>}
          {!isGeolocationEnabled && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            Geolocation disabled.</div>}

          {loading ? 'Loading…' : jobs.length === 0 ? (
            <div className="text-gray-600">
              {view === 'completed' ? 'No completed jobs.' : 'No claimed jobs.'}
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map(j => {
                const vanId = j.van && typeof j.van === 'string' ? j.van : j.van?._id;
                const addr = [j.pickupAddress.street, j.pickupAddress.area,
                  j.pickupAddress.city, j.pickupAddress.state,
                  j.pickupAddress.postalCode]
                  .filter(Boolean).join(', ');
                return (
                  <div key={j._id}
                    className="bg-white p-4 rounded shadow flex flex-col md:flex-row gap-4">
                    {/* left column */}
                    <div className="flex-1 space-y-2">
                      <div className="text-gray-800">
                        <strong>Customer:</strong> {j.customer.name} ({j.customer.phone})
                      </div>
                      <div className="text-gray-700 flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-red-500" /><span>{addr}</span>
                      </div>
                      <div className="text-gray-700">
                        <strong>When:</strong>{' '}
                        {j.type === 'scheduled'
                          ? new Date(j.scheduledFor).toLocaleString()
                          : 'ASAP'}
                      </div>
                      <div className="text-gray-700">
                        <strong>Remark:</strong> {j.remark || <em>none</em>}
                      </div>

                      {view === 'active' && (
                        <>
                          <div className="text-sm text-green-600">
                            <strong>Status:</strong> {j.status}
                          </div>

                          {/* status selector */}
                          <div className="flex items-center gap-2">
                            <select className="p-1 border rounded flex-1"
                              value={statusSel[j._id] || ''}
                              onChange={e => changeStatus(j._id, e.target.value)}>
                              <option value="" disabled>Change status…</option>
                              <option value="in_transit">In Transit</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button onClick={() => updateStatus(j._id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded">
                              Update
                            </button>
                          </div>

                          {/* live location toggle */}
                          <button
                            onClick={() => toggleLocation(vanId)}
                            disabled={disableGeo || !vanId}
                            className={`mt-2 px-4 py-2 rounded flex items-center gap-1 text-white ${
                              locationService.isReporting(vanId)
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            } ${disableGeo || !vanId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {locationService.isReporting(vanId)
                              ? (<><FaStop /> Stop</>)
                              : (<><FaLocationArrow /> Send location</>)}
                          </button>
                          {!vanId && (
                            <div className="text-red-600 text-sm mt-2">
                              Warning: Van not assigned (location reporting unavailable)
                            </div>
                          )}

                          {/* POS shortcut */}
                          <button
                            onClick={() => navigate(
                              `/pos?customer=${j.customer._id}&bookingId=${j._id}&customerModel=Customer`)}
                            className="mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded">
                            Start Sale
                          </button>
                        </>
                      )}

                      {view === 'completed' && j.order && (
                        <div className="mt-4 border-t pt-4">
                          <strong>Items Sold:</strong>
                          <ul className="list-disc ml-6">
                            {j.order.items.map((i, ix) => (
                              <li key={ix}>{i.quantity}× {i.item.itemName} @ ₹{i.price.toFixed(2)}
                                = ₹{i.subtotal.toFixed(2)}</li>))}
                          </ul>
                          <div className="mt-2">
                            <strong>Total Paid:</strong>{' '}
                            ₹{j.order.payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* right column – mini map */}
                    <div className="w-full md:w-64 h-48 border rounded overflow-hidden">
                      <iframe title={`map-${j._id}`}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=15&output=embed`}
                        className="w-full h-full" loading="lazy" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* stop any timer on tab close */
window.addEventListener('beforeunload', () => locationService.stopReporting());