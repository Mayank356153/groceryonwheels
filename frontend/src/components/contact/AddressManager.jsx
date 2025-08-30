import React, { useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt } from 'react-icons/fa';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import Input from './Input';
import Button from './Button';

/* ─────── Axios instance ─────── */
const api = axios.create({ baseURL: '/vps/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default function AddressManager() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({
    label: '', street: '', area: '', city: '', state: '', country: '',
    postalCode: '', isDefault: false, lat: '', lng: ''   // ← new fields
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /* handle changes */
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type==='checkbox' ? checked : value }));
  };

  /* submit */
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      /* only send lat/lng if both provided */
      const payload = { ...form };
      if (!payload.lat || !payload.lng) { delete payload.lat; delete payload.lng; }
      await api.post('/addresses', payload);
      setForm({ label:'', street:'', area:'', city:'', state:'', country:'', postalCode:'', isDefault:false, lat:'', lng:'' });
      alert('Address saved');
    } catch {
      setError('Failed to save address. Please check your input.');
    } finally { setLoading(false); }
  };

  const handleReset = () => { setForm({ label:'', street:'', area:'', city:'', state:'', country:'', postalCode:'', isDefault:false, lat:'', lng:'' }); setError(null); };

  /* ─────── UI ─────── */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Add Address</h1>
              <p className="text-sm text-gray-600">Enter address & optional coordinates</p>
            </div>
            <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:underline"><FaTachometerAlt className="mr-1"/>Home</NavLink>
          </div>

          <div className="bg-white p-6 rounded shadow-md max-w-3xl mx-auto">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

            <form onSubmit={handleSubmit} onReset={handleReset}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* basic fields */}
                {[
                  ['label','Label','text',true], ['street','Street','text',true], ['area','Area (opt.)','text',false],
                  ['city','City','text',true], ['state','State','text',true], ['country','Country','text',true],
                  ['postalCode','Postal Code','text',true]
                ].map(([name,label,type,req])=> (
                  <Input key={name} name={name} label={label} type={type}
                         value={form[name]} onChange={handleChange} required={req}
                         className="block w-full p-2 border border-gray-300 rounded" />
                ))}

                {/* coordinates */}
                <Input name="lat" label="Latitude (opt.)" type="number" step="any"
                       value={form.lat} onChange={handleChange}
                       className="block w-full p-2 border border-gray-300 rounded" />
                <Input name="lng" label="Longitude (opt.)" type="number" step="any"
                       value={form.lng} onChange={handleChange}
                       className="block w-full p-2 border border-gray-300 rounded" />

                <div className="flex items-center col-span-full">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange}
                           className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded" /> Set as default
                  </label>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button type="submit" text={loading?'Saving…':'Add'} disabled={loading}
                        className="px-10 py-2 text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50" />
                <Button type="reset" text="Reset" className="px-10 py-2 text-white bg-orange-500 rounded hover:bg-orange-600" />
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
