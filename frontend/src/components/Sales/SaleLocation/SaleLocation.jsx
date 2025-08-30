import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";
import Navbar from "../../Navbar";
import Sidebar from "../../Sidebar";

/* Utility: Distance in KM */
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* Utility: Fit map bounds */
const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

/* Click handler:
   - If no startPoint → click sets startPoint (must be outside circle)
   - If startPoint already set → click sets endPoint
*/
function ClickHandler({ setStartPoint, setEndPoint, startPoint, circleRadius }) {
  useMapEvents({
    click(e) {
      const clickedPoint = [e.latlng.lat, e.latlng.lng];

      if (!startPoint) {
        setStartPoint(clickedPoint);
      } else if (startPoint) {
        const dist = getDistanceInKm(
          startPoint[0],
          startPoint[1],
          clickedPoint[0],
          clickedPoint[1]
        );
        if (dist > circleRadius) {
          setStartPoint(clickedPoint);
          setEndPoint(null); 
        } else {
          setEndPoint(clickedPoint);
        }
      }
    },
  });
  return null;
}

/* Fetch ORS route via backend */
const fetchRouteORS = async (points, setPath) => {
  try {
    const coords = points.map((p) => `${p[1]},${p[0]}`).join("|");
    const response = await axios.get("/api/way/many", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      params: { coords },
    });

    const routeCoords =
      response.data.features[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);

    setPath(routeCoords);
  } catch (err) {
    console.error("ORS routing error:", err);
  }
};

export default function SaleLocation() {
  const link = "https://pos.inspiredgrow.in/vps";
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [bills, setBills] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [circleRadius, setCircleRadius] = useState(2); // in KM
  const [route, setRoute] = useState([]);

  /* Fetch bills */
  const fetchBills = async () => {
    const { data } = await axios.get(`/api/pos/invoices`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setBills(
      data.filter(
        (b) => b.location && Array.isArray(b.location) && b.location.length === 2
      )
    );
  };

  useEffect(() => {
    fetchBills();
    axios
      .get(`/api/warehouses?scope=mine`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => setWarehouses(data.data || []));
  }, []);

  /* Filter bills by date/warehouse */
  const filteredBills = bills.filter((b) => {
    const billDate = b.saleDate?.split("T")[0];
    const inRange =
      (!dateFrom || billDate >= dateFrom) &&
      (!dateTo || billDate <= dateTo);
    const matchWarehouse =
      !selectedWarehouse ||
      selectedWarehouse === "all" ||
      b.warehouse._id === selectedWarehouse;
    return inRange && matchWarehouse;
  });

  /* Bills inside circle */
  const billsInsideCircle =
    startPoint && circleRadius
      ? filteredBills.filter((b) => {
          return (
            getDistanceInKm(
              startPoint[0],
              startPoint[1],
              b.location[0],
              b.location[1]
            ) <= circleRadius
          );
        })
      : [];

  /* Route: Start → billsInsideCircle → End */
  useEffect(() => {
    if (startPoint && endPoint) {
      const waypoints = [
        startPoint,
        ...billsInsideCircle.map((b) => [b.location[0], b.location[1]]),
        endPoint,
      ];
      fetchRouteORS(waypoints, setRoute);
    }
  }, [startPoint, endPoint, circleRadius, filteredBills]);

  const bounds =
    startPoint || endPoint
      ? [
          ...(startPoint ? [startPoint] : []),
          ...(endPoint ? [endPoint] : []),
          ...billsInsideCircle.map((b) => b.location),
        ]
      : [];

      
const groupedBills = filteredBills.reduce((acc, bill) => {
  if (!Array.isArray(bill.location) || bill.location.length !== 2) return acc;

  const key = bill.location.join(","); // e.g. "28.61,77.23"
  if (!acc[key]) {
    acc[key] = {
      location: bill.location,
      bills: [],
    };
  }
  acc[key].bills.push(bill);
  return acc;
}, {});



  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-100 border-r">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="relative flex-1">
          {/* Filters */}
          <div className="absolute top-4 left-8 z-[1000] bg-white p-4 rounded shadow w-72 text-sm space-y-2">
            <label>Warehouse:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">All</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
            <label>Date From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-1 border rounded"
            />
            <label>Date To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-1 border rounded"
            />
            <label>Radius (km):</label>
            <input
              type="number"
              value={circleRadius}
              onChange={(e) => setCircleRadius(Number(e.target.value))}
              className="w-full p-1 border rounded"
            />
          </div>

          {/* Map */}
          <div className="w-full h-full">
            <MapContainer
              center={[29.1489, 75.7217]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <ClickHandler
                setStartPoint={setStartPoint}
                setEndPoint={setEndPoint}
                startPoint={startPoint}
                circleRadius={circleRadius}
              />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {bounds.length > 0 && <FitBounds bounds={bounds} />}

              {/* Start marker */}
              {startPoint && (
                <Marker
                  position={startPoint}
                  icon={L.icon({
                    iconUrl:
                      "https://cdn-icons-png.flaticon.com/512/447/447031.png",
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                  })}
                >
                  <Popup>Start Point</Popup>
                </Marker>
              )}

              {/* End marker */}
              {endPoint && (
                <Marker
                  position={endPoint}
                  icon={L.icon({
                    iconUrl:
                      "https://cdn-icons-png.flaticon.com/512/149/149059.png",
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                  })}
                >
                  <Popup>End Point</Popup>
                </Marker>
              )}

              {/* Circle */}
              {startPoint && (
                <Circle
                  center={startPoint}
                  radius={circleRadius * 1000}
                  pathOptions={{
                    color: "red",
                    fillColor: "#f03",
                    fillOpacity: 0.3,
                  }}
                />
              )}

              {Object.values(groupedBills).map((group, i) => (
  <Marker
    key={i}
    position={group.location}
    icon={L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })}
  >
    <Popup>
      <div>
        <h4 className="mb-2 font-bold">Bills at this location</h4>
        {group.bills.map((b, j) => (
          <div key={j} className="pb-1 mb-1 border-b border-gray-300">
            <div><strong>Date:</strong> {new Date(b.saleDate).toLocaleDateString()}</div>
            <div><strong>SaleCode:</strong> {b.saleCode}</div>
            <div><strong>Amount:</strong> ₹{b.amount?.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </Popup>
  </Marker>
))}

              {/* Route polyline */}
              {route.length > 1 && (
                <Polyline positions={route} color="blue" weight={4} />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
