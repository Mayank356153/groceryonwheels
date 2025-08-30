import React, { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";
import { useNavigate, useSearchParams } from "react-router-dom";

const StoreTab = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // If present, we're in edit mode

  const countries = {
    India: ["Andhra Pradesh", "Delhi", "Goa", "Karnataka", "Maharashtra"],
    USA: ["California", "Texas", "Florida", "New York"],
    Canada: ["Ontario", "Quebec", "British Columbia"],
  };

  const [accounts, setAccounts] = useState([]);
  const [storeAccount, setStoreAccount] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [Phone, setPhone] = useState("");
  const [Country, setCountry] = useState("");
  const [GST_NUMBER, setGST_NUMBER] = useState("");
  const [Tax_Number, setTax_Number] = useState("");
  const [Pan_Number, setPan_Number] = useState("");
  const [Bank_Details, setBank_Details] = useState("");
  const [store_website, setstore_website] = useState("");
  const [PostCode, setPostCode] = useState("");
  const [state, setState] = useState("");
  const [City, setCity] = useState("");
  const [Address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [localPermissions, setLocalPermissions] = useState([]);
  const [storeCode, setStoreCode] = useState("");
  const [Latitude, setLatitude] = useState("");
  const [Longitude, setLongitude] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCreateWarehouse, setAutoCreateWarehouse] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseMobile, setWarehouseMobile] = useState("");
  const [warehouseEmail, setWarehouseEmail] = useState("");
  const [warehouseTid, setWarehouseTid] = useState("");
  const [warehouseQrFile, setWarehouseQrFile] = useState(null);

  // Function to generate new StoreCode
  function generateNewStoreCode(lastCode) {
    const prefix = "STORE";
    if (!lastCode) {
      return `${prefix}001`;
    }
    const match = lastCode.match(/^STORE(\d+)$/i);
    if (!match) {
      throw new Error("Invalid store code format");
    }
    const number = parseInt(match[1], 10);
    const newNumber = number + 1;
    return prefix + String(newNumber).padStart(3, "0");
  }

  // Fetch parent accounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }
    fetch("/api/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const parentAccounts = (data.data || []).filter((acc) => !acc.parentAccount);
        setAccounts(parentAccounts);
      })
      .catch((error) => {
        console.error("Error fetching accounts:", error);
        setError("Failed to load parent accounts.");
      });
  }, []);

  // Fetch stores to generate StoreCode (for add mode)
  useEffect(() => {
    if (!id) {
      const fetchStores = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in.");
          return;
        }
        try {
          setLoading(true);
          const response = await fetch("/admin/store/add/store", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch stores: ${response.statusText}`);
          }
          const data = await response.json();
          console.log("Fetched stores:", data);
          const storeList = data.result || [];
          const lastStore = storeList.length > 0 ? storeList[storeList.length - 1] : null;
          const lastCode = lastStore ? lastStore.StoreCode : null;
          setStoreCode(generateNewStoreCode(lastCode));
          setError(null);
        } catch (error) {
          console.error("Error fetching stores:", error);
          setError("Failed to load stores for generating store code.");
        } finally {
          setLoading(false);
        }
      };
      fetchStores();
    }
  }, [id]);

  // Fetch store data for edit mode
  useEffect(() => {
    if (id) {
      const fetchStore = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in.");
          return;
        }
        try {
          setLoading(true);
          const response = await fetch(`/admin/store/store/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch store: ${response.statusText}`);
          }
          const data = await response.json();
          console.log("Fetched store:", data);
          const store = data.result;
          if (!store) {
            throw new Error("Store data not found in response");
          }
          setStoreCode(store.StoreCode || "");
          setFirstName(store.StoreName || "");
          setMobile(store.Mobile || "");
          setEmail(store.Email || "");
          setPhone(store.Phone || "");
          setGST_NUMBER(store.Gst_Number || "");
          setTax_Number(store.Tax_Number || "");
          setPan_Number(store.Pan_Number || "");
          setstore_website(store.Store_website || "");
          setBank_Details(store.Bank_details || "");
          setCountry(store.Country || "");
          setState(store.State || "");
          setCity(store.City || "");
          setPostCode(store.PostCode || "");
          setAddress(store.Address || "");
          setLatitude(store.Latitude || "");
          setLongitude(store.Longitude || "");
          setStoreAccount(store.storeAccount?._id || store.storeAccount || "");
          if (store.warehouse) {
            setWarehouseName(store.warehouse.warehouseName || "");
            setWarehouseMobile(store.warehouse.mobile || "");
            setWarehouseEmail(store.warehouse.email || "");
            setWarehouseTid(store.warehouse.tid || "");
          }
          setError(null);
        } catch (error) {
          console.error("Error fetching store:", error);
          setError(error.message || "Failed to load store data.");
        } finally {
          setLoading(false);
        }
      };
      fetchStore();
    }
  }, [id]);

  // Use react-geolocated to auto-fetch coordinates
  const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError } = useGeolocated({
    positionOptions: { enableHighAccuracy: false },
    userDecisionTimeout: 5000,
  });

  // Update Latitude and Longitude when coords change
  useEffect(() => {
    if (coords && !id) {
      setLatitude(coords.latitude.toString());
      setLongitude(coords.longitude.toString());
    }
  }, [coords, id]);

  // Load permissions from localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        setLocalPermissions(JSON.parse(storedPermissions));
      } catch (error) {
        console.error("Error parsing permissions:", error);
        setLocalPermissions([]);
      }
    } else {
      setLocalPermissions([]);
    }
  }, []);

  const hasPermissionFor = (module, action) => {
    const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
    if (userRole === "admin") return true;
    return localPermissions.some(
      (perm) =>
        perm.module.toLowerCase() === module.toLowerCase() &&
        perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // Check permissions for add or edit
  if (id && !hasPermissionFor("stores", "edit")) {
    return <div>Insufficient permissions to edit a store.</div>;
  }
  if (!id && !hasPermissionFor("stores", "add")) {
    return <div>Insufficient permissions to add a store.</div>;
  }

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    setState("");
  };

  const handleGetLocation = () => {
    if (!isGeolocationAvailable) {
      alert("Geolocation is not available in your browser.");
    } else if (!isGeolocationEnabled) {
      alert("Geolocation is not enabled. Please enable location services.");
    } else if (positionError) {
      alert("Error fetching location. Please enter manually.");
    } else {
      alert("Location auto-fetched.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      StoreCode: storeCode,
      StoreName: firstName,
      Mobile: mobile,
      Email: email,
      Phone: Phone,
      Gst_Number: GST_NUMBER,
      Tax_Number: Tax_Number,
      Pan_Number: Pan_Number,
      Store_website: store_website,
      Bank_details: Bank_Details,
      Country: Country,
      State: state,
      City: City,
      PostCode: PostCode,
      Address: Address,
      Latitude,
      Longitude,
      storeAccount: storeAccount || undefined, // Send undefined if empty to trigger auto-creation
      autoCreateWarehouse,
      tid: autoCreateWarehouse ? warehouseTid : undefined,
    };
    console.log("Form Data:", formData);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found. Please log in.");
      return;
    }
    try {
      const url = id
        ? `/admin/store/store/${id}`
        : "/admin/Store/add/Store";
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${id ? "update" : "create"} store`);
      }
      const result = await response.json();
      console.log("Backend Response:", result);
      alert(`Store ${id ? "updated" : "saved"} successfully! ${!storeAccount && !id ? "Parent account auto-created." : ""}`);
      // Reset form
      setUsername("");
      setFirstName("");
      setMobile("");
      setEmail("");
      setPhone("");
      setGST_NUMBER("");
      setTax_Number("");
      setPan_Number("");
      setstore_website("");
      setBank_Details("");
      setCountry("");
      setState("");
      setCity("");
      setPostCode("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setStoreAccount("");
      setAutoCreateWarehouse(false);
      setWarehouseName("");
      setWarehouseMobile("");
      setWarehouseEmail("");
      setWarehouseTid("");
      setWarehouseQrFile(null);
      setStoreCode(id ? storeCode : generateNewStoreCode(storeCode));
      navigate("/store/view");
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleClose = () => {
    setUsername("");
    setFirstName("");
    setMobile("");
    setEmail("");
    setPhone("");
    setGST_NUMBER("");
    setTax_Number("");
    setPan_Number("");
    setstore_website("");
    setBank_Details("");
    setCountry("");
    setState("");
    setCity("");
    setPostCode("");
    setAddress("");
    setLatitude("");
    setLongitude("");
    setStoreAccount("");
    setAutoCreateWarehouse(false);
    setWarehouseName("");
    setWarehouseMobile("");
    setWarehouseEmail("");
    setWarehouseTid("");
    setWarehouseQrFile(null);
    navigate("/store/view");
  };

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleWarehouseQrFileChange = (e) => {
    setWarehouseQrFile(e.target.files[0]);
  };

  if (loading) {
    return <div className="p-4">Loading store data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="mx-auto overflow-y-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{id ? "Edit Store" : "Add Store"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-20">
          <div className="flex w-full gap-32">
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="storeCode" className="block mb-2 font-medium">
                  Store Code*
                </label>
                <input
                  id="storeCode"
                  type="text"
                  value={storeCode || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block mb-2 font-medium">
                  Store Name*
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block mb-2 font-medium">
                  Mobile
                </label>
                <input
                  id="mobile"
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Phone" className="block mb-2 font-medium">
                  Phone*
                </label>
                <input
                  id="Phone"
                  type="text"
                  value={Phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="GST_NUMBER" className="block mb-2 font-medium">
                  GST Number*
                </label>
                <input
                  id="GST_NUMBER"
                  type="text"
                  value={GST_NUMBER}
                  onChange={(e) => setGST_NUMBER(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Tax_Number" className="block mb-2 font-medium">
                  Tax Number*
                </label>
                <input
                  id="Tax_Number"
                  type="text"
                  value={Tax_Number}
                  onChange={(e) => setTax_Number(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div>
                <label htmlFor="Pan_Number" className="block mb-2 font-medium">
                  Pan Number*
                </label>
                <input
                  id="Pan_Number"
                  type="text"
                  value={Pan_Number}
                  onChange={(e) => setPan_Number(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Store_website" className="block mb-2 font-medium">
                  Store Website*
                </label>
                <input
                  id="Store_website"
                  type="text"
                  value={store_website}
                  onChange={(e) => setstore_website(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Bank_Details" className="block mb-2 font-medium">
                  Bank Details
                </label>
                <input
                  id="Bank_Details"
                  type="text"
                  value={Bank_Details}
                  onChange={(e) => setBank_Details(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className="block mb-2 font-medium">
                  Country*
                </label>
                <select
                  id="country"
                  value={Country}
                  onChange={handleCountryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Country</option>
                  {Object.keys(countries).map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              {Country && (
                <div>
                  <label htmlFor="state" className="block mb-2 font-medium">
                    State*
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select State</option>
                    {countries[Country]?.map((stateOption, index) => (
                      <option key={index} value={stateOption}>
                        {stateOption}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="City" className="block mb-2 font-medium">
                  City*
                </label>
                <input
                  id="City"
                  type="text"
                  value={City}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="PostCode" className="block mb-2 font-medium">
                  PostCode*
                </label>
                <input
                  id="PostCode"
                  type="text"
                  value={PostCode}
                  onChange={(e) => setPostCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="Address" className="block mb-2 font-medium">
                  Address*
                </label>
                <input
                  id="Address"
                  type="text"
                  value={Address}
                  onChange={(e) => setAddress(e.target.value)}
                  classNameerythrocyte="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium">Store Account</label>
                <select
                  value={storeAccount}
                  onChange={(e) => setStoreAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Auto-create Parent Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountNumber} – {acc.accountName}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Leave blank to auto-create a parent account for this store.
                </p>
              </div>
              <div>
                <p>
                  <strong>Latitude:</strong> {Latitude || "Not set"}
                </p>
                <p>
                  <strong>Longitude:</strong> {Longitude || "Not set"}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Refresh Location
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="profilePicture" className="block mb-2 font-medium">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <input
                id="profilePicture"
                type="file"
                onChange={handleProfilePictureChange}
                className="block w-full sm:w-auto"
              />
              {profilePicture && (
                <img
                  src={URL.createObjectURL(profilePicture)}
                  alt="Profile"
                  className="max-w-[150px] max-h-[150px] rounded-md border border-gray-300"
                />
              )}
            </div>
          </div>
        </div>

        {/* Warehouse Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Warehouse Settings</h3>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={autoCreateWarehouse}
                onChange={(e) => setAutoCreateWarehouse(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2">Auto-create Warehouse</span>
            </label>
          </div>
          {autoCreateWarehouse && (
            <div className="space-y-4">
              <div>
                <label htmlFor="warehouseName" className="block mb-2 font-medium">
                  Warehouse Name*
                </label>
                <input
                  id="warehouseName"
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="warehouseMobile" className="block mb-2 font-medium">
                  Warehouse Mobile
                </label>
                <input
                  id="warehouseMobile"
                  type="text"
                  value={warehouseMobile}
                  onChange={(e) => setWarehouseMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="warehouseEmail" className="block mb-2 font-medium">
                  Warehouse Email
                </label>
                <input
                  id="warehouseEmail"
                  type="email"
                  value={warehouseEmail}
                  onChange={(e) => setWarehouseEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="warehouseTid" className="block mb-2 font-medium">
                  Terminal ID*
                </label>
                <input
                  id="warehouseTid"
                  type="text"
                  value={warehouseTid}
                  onChange={(e) => setWarehouseTid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="warehouseQrFile" className="block mb-2 font-medium">
                  Warehouse QR Code
                </label>
                <input
                  id="warehouseQrFile"
                  type="file"
                  onChange={handleWarehouseQrFileChange}
                  className="block w-full sm:w-auto"
                />
                {warehouseQrFile && (
                  <img
                    src={URL.createObjectURL(warehouseQrFile)}
                    alt="Warehouse QR"
                    className="max-w-[150px] max-h-[150px] rounded-md border border-gray-300 mt-2"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="submit"
            className="px-6 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600"
          >
            {id ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreTab;