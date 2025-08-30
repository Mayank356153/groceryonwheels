// src/components/CreateUser.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import LoadingScreen from "../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");      // for editing existing user

  // side‑menu
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // master data

  // tag‑group picks

  // form + passwords + loading
  const [formData, setFormData] = useState({
    userName: "",
    FirstName: "",
    LastName: "",
    Mobile: "",
    Email: "",
    profileImage: "",
  });
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const id=localStorage.getItem("id")
  // fetch lookups
  const fetchCurrentUser = async () => {
    setLoading(true);
    
   
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/");
      return;
    }

    try {
      const response = await axios.get(
          `admiaddinguser/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(response)
   
    
      }
     catch (error) {
      console.error("Error fetching roles:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    
   
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/");
      return;
    }

    try {
      const response = await axios.get(
          `admiaddinguser/userlist`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("user")
      console.log(response)
   
    
      }
     catch (error) {
      console.error("Error fetching roles:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{
    fetchUser();
    fetchCurrentUser();
  },[])

 



  

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({
      ...f,
      [name]: name === "Mobile" ? Number(value) : value
    }));
  };


 
  const submit = async e => {
    e.preventDefault();
    if (password !== confPassword) {
      return alert("Passwords do not match");
    }
    setLoading(true);
    const payload = {
           ...formData,
           Password: password,
          // ← add this line so we can filter later
           createdBy: localStorage.getItem("userId")
         };
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      if (editId) {
        await axios.put(`admiaddinguser/${editId}`, payload, { headers });
        alert("User updated");
      } else {
        await axios.post("admiaddinguser/adduserbyadmin", payload, { headers });
        alert("User created");
      }
      navigate("/admin/user/list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <form onSubmit={submit} className="flex-grow p-6 overflow-auto bg-gray-100">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                     Edit User
              </h1>
              <p className="text-gray-600">{editId ? "Modify details" : "Fill in details"}</p>
            </div>
            <nav className="flex items-center text-gray-500">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1"/> Home
              </NavLink>
              <BiChevronRight className="mx-2"/>
              <NavLink to="/admin/user/list">User List</NavLink>
            </nav>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left */}
            <div className="space-y-4">
              {[
                { label:"Username", name:"userName", req:true },
                { label:"First Name", name:"FirstName", req:true },
                { label:"Last Name", name:"LastName", req:true },
                { label:"Mobile", name:"Mobile" },
                { label:"Email", name:"Email", type:"email", req:true }
              ].map(({ label,name,type="text",req })=>(
                <div key={name}>
                  <label className="block font-semibold">
                    {label}{req && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required={req}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

             

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">Password<span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold">Confirm<span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={confPassword}
                    onChange={e=>setConfPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              {/* Warehouse group */}
             

             

            
              {/* Profile pic */}
              <div>
                <label className="block font-semibold">Profile Picture</label>
                <input
                  type="file"
                  onChange={e=>{
                    const file = e.target.files[0];
                    if (!file) return;
                    setFormData(f=>({
                      ...f,
                      profileImage: URL.createObjectURL(file)
                    }));
                  }}
                  className="w-full p-2 border rounded"
                />
                <div className="w-64 h-64 mt-2 overflow-hidden border rounded">
                  <img
                    src={formData.profileImage||"/userlogoprof.png"}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-8 py-2 text-white bg-green-600 rounded">
              {editId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={()=>navigate("/admin/user/list")}
              className="px-8 py-2 text-white bg-orange-500 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
