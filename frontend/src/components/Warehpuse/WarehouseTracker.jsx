// src/components/Warehouse/WarehouseTracker.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

export default function WarehouseTracker() {
  const [params]     = useSearchParams();
  const warehouseId  = params.get('id');
  const token        = localStorage.getItem('token');
  const apiUrl       = `/api/warehouse-location/${warehouseId}`;

  // no hard-coded fallback any more
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!warehouseId) return;
    const fetchLocation = async () => {
      try {
        const { data } = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const [lng, lat] = data.data.coords.coordinates;   // ← fixed
        setPosition({ lat, lng });
      } catch (err) {
        console.error('fetchLocation error:', err);
      }
    };
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [warehouseId, apiUrl, token]);

  // wait until we have a real location
  if (!position) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading live position…
    </div>;
  }

  const mapSrc =
    `https://maps.google.com/maps?q=${position.lat},${position.lng}` +
    `&z=17&output=embed`;

  return (
    <iframe
      title="Warehouse Tracker"
      src={mapSrc}
      width="100%"
      height="100vh"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
    />
  );
}
