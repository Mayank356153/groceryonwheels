
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For redirection
import axios from "axios";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar"

const AddUser = () => {
  const navigate = useNavigate();

  // User form state
  const [formData, setFormData] = useState({
    userName: "",
    FirstName: "",
    LastName: "",
    Mobile: "",
    Email: "",
    Store: "",
    Role: "",
    Password: "",
    WarehouseGroup: "",
    Defaultwarehouse: "",
  });

  const [roles, setRoles] = useState([]); // Role dropdown options
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Roles when the component loads
  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Redirecting to login...");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("admincreatingrole/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Roles API Response:", response.data);

        if (response.data && Array.isArray(response.data.roles)) {
          setRoles(response.data.roles);
        } else {
          console.error("Invalid role data received:", response.data);
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching roles:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          console.warn("Unauthorized! Clearing localStorage and redirecting...");
          localStorage.clear();
          navigate("/login");
        }
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [navigate]);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "admiaddinguser/adduserbyadmin",
        formData,
        {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
        }
      );

      console.log("User Created Response:", response.data);

      setMessage("User added successfully!");
      setFormData({
        userName: "",
        FirstName: "",
        LastName: "",
        Mobile: "",
        Email: "",
        Store: "",
        Role: "",
        Password: "",
        WarehouseGroup: "",
        Defaultwarehouse: "",
      });
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow mt-20">
        <div className="w-64">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="w-full p-20">
          {/* Success & Error Messages */}
          {message && <div className="font-bold text-green-600">{message}</div>}
          {error && <div className="font-bold text-red-600">{error}</div>}

          <h1 className="mb-6 text-2xl font-bold text-start">Create User</h1>

          {/* Loading Indicator for Roles */}
          {loading ? (
            <p>Loading roles...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-10">
                {/* Left Column */}
                <div className="space-y-4">
                  <label className="block font-medium">Username*</label>
                  <input type="text" name="userName" placeholder="UserName" className="w-full px-3 py-2 border" value={formData.userName} onChange={handleChange} required />

                  <label className="block font-medium">First Name*</label>
                  <input type="text" name="FirstName" className="w-full px-3 py-2 border" value={formData.FirstName} onChange={handleChange} required />

                  <label className="block font-medium">Last Name*</label>
                  <input type="text" name="LastName" className="w-full px-3 py-2 border" value={formData.LastName} onChange={handleChange} required />

                  <label className="block font-medium">Mobile</label>
                  <input type="text" name="Mobile" className="w-full px-3 py-2 border" value={formData.Mobile} onChange={handleChange} />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <label className="block font-medium">Email*</label>
                  <input type="email" name="Email" className="w-full px-3 py-2 border" value={formData.Email} onChange={handleChange} required />

                  <label className="block font-medium">Store:</label>
                  <select name="Store" className="w-full px-3 py-2 border" value={formData.Store} onChange={handleChange} required>
                    <option value="">Select Store</option>
                    <option value="SAAS ADMIN">SAAS ADMIN</option>
                    <option value="POS">POS</option>
                    <option value="Keshav demo 1">Keshav demo 1</option>
                    <option value="Keshav demo 2">Keshav demo 2</option>
                    <option value="grocery on wheels">Grocery on Wheels</option>
                  </select>

                  <label className="block font-medium">Role:</label>
                  <select name="Role" className="w-full px-3 py-2 border" value={formData.Role} onChange={handleChange} required>
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.roleName}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>

                  <label className="block font-medium">Password*</label>
                  <input type="password" name="Password" className="w-full px-3 py-2 border" value={formData.Password} onChange={handleChange} required />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-4 mt-6">
                <button type="submit" className="px-6 py-2 font-bold text-white bg-green-500 rounded-md">Save</button>
                <button type="button" className="px-6 py-2 font-bold text-white bg-orange-500 rounded-md" onClick={() => window.location.reload()}>Close</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddUser;

