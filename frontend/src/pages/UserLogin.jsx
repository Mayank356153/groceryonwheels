// src/components/UserLogin.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "admiaddinguser/userlogin",
        user
      );
      const { token, user: userInfo, permissions } = res.data;

      // 1) Save JWT
      localStorage.setItem("token", token);

      // 2) Decode token to pull out id, role id, and stores[]
      localStorage.setItem("role",   userInfo.Role.toLowerCase());
   localStorage.setItem("userId", userInfo.id);
   localStorage.setItem("roleId", userInfo.Role);

   /* 2-b  Save ALL store IDs */
   const storeArr = Array.isArray(userInfo.stores) ? userInfo.stores : [];
   localStorage.setItem("stores", JSON.stringify(storeArr));

   // Legacy convenience key (only when there is exactly ONE)
   if (storeArr.length === 1) {
     localStorage.setItem("storeId", storeArr[0]);
   } else {
     localStorage.removeItem("storeId");   // avoid stale single-store value
   }

      // 3) Save permissions array
      localStorage.setItem("permissions", JSON.stringify(permissions || []));

      alert("User logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">
          User Login
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;