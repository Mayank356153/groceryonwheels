// components/SendMessage.jsx
import React, { useState, useEffect } from 'react';
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaPlus } from "react-icons/fa";
import axios from 'axios';
import LoadingScreen from '../../Loading';

const SendMessage = () => {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const location = useLocation();
  const templateContent = location.state?.templateContent || "";

  const [formData, setFormData] = useState({
    message: templateContent,
    phoneNumbers: [],
    sentAt: new Date().toISOString(),
  });

  const handleChange = (e) => {
    const { name } = e.target;
    if (name === "mobile") {
      if (mobile.length === 10) {
        setFormData((prev) => ({
          ...prev,
          phoneNumbers: [...prev.phoneNumbers, mobile],
        }));
        alert("Number added successfully");
        setMobile("");
      } else {
        alert("Invalid Number (must be 10 digits)");
      }
    }
  };

  const handleMessageChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      message: value,
    }));
  };

  const postData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "api/message/send",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Message Sent Successfully");
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      alert("Unsuccessful: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phoneNumbers.length <= 0) {
      alert("Add at least one Mobile Number");
      return;
    }

    await postData();

    setMobile("");
    setFormData({
      message: "",
      phoneNumbers: [],
      sentAt: new Date().toISOString(),
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex flex-col flex-grow w-full min-h-screen ">
          <header className="flex flex-col items-center justify-between p-4 mb-6 bg-gray-100 rounded-lg md:flex-row">
            <h1 className="text-2xl font-semibold">Send Message</h1>
            <div className="flex items-center space-x-2 text-blue-600">
              <Link
                to="/dashboard"
                className="flex items-center text-sm text-gray-500 no-underline hover:text-cyan-600"
              >
                <FaTachometerAlt className="mr-2" /> Home
              </Link>
              <span className="text-gray-400">{">"}</span>
              <Link
                to="/message-templates-list"
                className="text-sm text-gray-500 no-underline hover:text-cyan-600"
              >
                Message Templates
              </Link>
            </div>
          </header>

          <div className="w-full p-6 mx-auto bg-white rounded-lg shadow-lg ">
            <h2 className="mb-4 text-xl font-semibold">Send Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="mobile"
                >
                  Mobile *
                </label>
                <label className="flex items-center w-full">
                  <input
                    type="text"
                    id="mobile"
                    value={mobile}
                    minLength="10"
                    maxLength="10"
                    onChange={(e) => setMobile(e.target.value)}
                    className="block w-full px-2 py-[10px] mt-1 border border-gray-300 rounded-none shadow-sm rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-700"
                    placeholder="Enter 10-digit Number"
                  />
                  <button
                    className="flex items-center justify-center h-full px-2 mt-1 border-2 border-gray-300 rounded-none shadow-sm rounded-r-md"
                    name="mobile"
                    type="button"
                    onClick={handleChange}
                  >
                    <FaPlus />
                  </button>
                </label>
                {formData.phoneNumbers.length > 0 && (
                  <ul className="mt-2 text-sm">
                    {formData.phoneNumbers.map((num, idx) => (
                      <li key={idx} className="text-gray-700">
                        {num}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="message"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleMessageChange}
                  className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-cyan-500"
                  rows="4"
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white transition bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Send
                </button>
                <button
                  type="button"
                  className="px-4 py-2 font-semibold text-white transition bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
