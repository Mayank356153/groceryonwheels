import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

/* ─────── axios instance ─────── */
const api = axios.create({ baseURL: '/vps/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* quick haversine (km) */
const distKm = (lat1,lng1,lat2,lng2) => {
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
};

export default function AdminAllAddresses() {
  /* layout */
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  /* data */
  const [raw, setRaw]      = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /* text filters */
  const [q, setQ] = useState({ customer:'', street:'', area:'', city:'', state:'', postalCode:'' });

  /* optional distance filter */
  const [useDistance, setUseDistance] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [center, setCenter] = useState({ lat:'', lng:'' });

  /* expand/collapse */
  const [openIds, setOpenIds] = useState(()=>new Set());
  const toggle = id => setOpenIds(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});

  /* fetch once */
  useEffect(() => {
    setLoading(true);
    api.get('/addresses/admin/all')
      .then(r => { setRaw(r.data.data||[]); setError(null); })
      .catch(()=> setError('Failed to load addresses'))
      .finally(()=> setLoading(false));
  }, []);

  const includes = (field,val)=>field.toLowerCase().includes(val.toLowerCase());

  /* group + filter */
  const grouped = useMemo(() => {
    const wantGeo = useDistance && center.lat && center.lng && !Number.isNaN(parseFloat(center.lat)) && !Number.isNaN(parseFloat(center.lng));
    const cLat = parseFloat(center.lat), cLng=parseFloat(center.lng);

    const map=new Map();
    for(const addr of raw){
      const name=addr.user?.name||'Unknown customer';
      const userId=addr.user?._id||`unknown-${addr._id}`;

      // text filters
      if(q.customer&& !includes(name,q.customer)) continue;
      if(q.street&& !includes(addr.street||'',q.street)) continue;
      if(q.area&& !includes(addr.area||'',q.area)) continue;
      if(q.city&& !includes(addr.city||'',q.city)) continue;
      if(q.state&& !includes(addr.state||'',q.state)) continue;
      if(q.postalCode&& !includes(addr.postalCode||'',q.postalCode)) continue;

      // optional distance filter
      if(wantGeo){
        const coords=addr.location?.coordinates;
        if(!coords) continue;
        const [lng,lat]=coords;
        if(distKm(cLat,cLng,lat,lng)>radiusKm) continue;
      }

      if(!map.has(userId)) map.set(userId,{name,addresses:[]});
      map.get(userId).addresses.push(addr);
    }
    for(const g of map.values()) g.addresses.sort((a,b)=>(b.isDefault?1:0)-(a.isDefault?1:0));
    return [...map.entries()];
  }, [raw,q,useDistance,center,radiusKm]);

  /* helper to auto-fill coords from browser */
  const geoMe = () => {
    if(!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(pos=>{
      setCenter({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
      setUseDistance(true);
    }, ()=>alert('Unable to get position'));
  };

  /* ─────── UI ─────── */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Customer Addresses</h1>
              <p className="text-sm text-gray-600">Default address shown first. Click row to expand.</p>
            </div>
            <NavLink to="/dashboard" className="flex items-center text-gray-700 hover:underline"><FaTachometerAlt className="mr-1"/>Home</NavLink>
          </div>

          {/* distance toggle */}
          <div className="mb-6 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={useDistance} onChange={e=>setUseDistance(e.target.checked)} />
              Enable distance filter
            </label>
            {useDistance && (
              <>
                <input type="number" step="any" placeholder="Latitude" value={center.lat}
                       onChange={e=>setCenter({...center,lat:e.target.value})}
                       className="p-2 border border-gray-300 rounded w-32" />
                <input type="number" step="any" placeholder="Longitude" value={center.lng}
                       onChange={e=>setCenter({...center,lng:e.target.value})}
                       className="p-2 border border-gray-300 rounded w-32" />
                <input type="range" min={1} max={5000} value={radiusKm}
                       onChange={e=>setRadiusKm(parseInt(e.target.value))} className="w-40" />
                <span className="text-sm text-gray-700">{radiusKm} km</span>
                <button onClick={geoMe} className="px-3 py-1 text-sm bg-blue-500 text-white rounded">Use my location</button>
              </>
            )}
          </div>

          {/* text filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6">
            {['customer','street','area','city','state','postalCode'].map(key=> (
              <input key={key} name={key} placeholder={key} value={q[key]}
                     onChange={e=>setQ(prev=>({...prev,[key]:e.target.value}))}
                     className="p-2 border border-gray-300 rounded" />
            ))}
          </div>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
          {loading && <div>Loading…</div>}
          {!loading && grouped.length===0 && !error && <div className="text-gray-600">No matches.</div>}

          {!loading && grouped.length>0 && (
            <div className="space-y-4">
              {grouped.map(([userId,group])=>{
                const [first,...rest]=group.addresses;
                const open=openIds.has(userId);
                return (
                  <div key={userId} className="bg-white rounded shadow divide-y">
                    <button onClick={()=>toggle(userId)} className="w-full text-left p-4 flex justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-semibold">{group.name}{first.isDefault&&<span className="ml-2 text-sm text-green-600">(Default)</span>}</div>
                        <div className="text-gray-700">{first.label} – {first.street}{first.area&&`, ${first.area}`}, {first.city}, {first.state}, {first.country} — {first.postalCode}</div>
                      </div>
                      {rest.length>0 && (open? <FaChevronDown className="mt-1"/>:<FaChevronRight className="mt-1"/>)}
                    </button>
                    {open&&rest.length>0 && (
                      <div className="p-4 space-y-2">{rest.map(a=>(<div key={a._id} className="text-gray-700">{a.label} – {a.street}{a.area&&`, ${a.area}`}, {a.city}, {a.state}, {a.country} — {a.postalCode}</div>))}</div>
                    )}
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