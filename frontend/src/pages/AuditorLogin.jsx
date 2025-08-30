import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuditorLogin = () => {
  const [user, setUser] = useState({ username: "", password: "" });
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
        "/api/audit/login",
        user
      );
     
     console.log(res)
      // save JWT
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("id", res.data.user.id)
      localStorage.setItem("role", res.data.user.role)
      localStorage.setItem("auditId",res.data.user.auditId)
      // save role
     
      // localStorage.setItem("id", res.data.user.id)
      // save storeId so you know which store this user belongs to
     

      alert("Audit User logged in successfully!");
      navigate("/auditor-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">
          Auditor Login
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
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

export default AuditorLogin;
