import React, { useState,useEffect } from 'react';

import img1 from '../../image/noimage.png';
import img2 from '../../image/nologo.png';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";

const StoreForm = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
  const [formData, setFormData] = useState({
    storeCode: '',
    storeName: '',
    mobile: '',
    email: '',
    phone: '',
    gstNumber: '',
    taxNumber: '',
    panNumber: '',
    bankDetails: '',
    country: '',
    state: '',
    city: '',
    postcode: '',
    address: '',
    storeWebsite: '',
    storeLogo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      storeLogo: e.target.files[0],
    }));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-grow">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Content */}
        <div className={`flex-grow flex flex-col p-4  transition-all duration-300 w-full`}>
     
          {/* Main Content */}
          <div className="h-8 mb-4 rounded-lg">
            {/* Navbar Links */}
            <div className='flex justify-between'>

              <h4 className='mb-2 text-black'>Store</h4>

              <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                  <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                </a>
                <BiChevronRight className="mx-1 sm:mx-2" />
                <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Accounts List</a>
                <BiChevronRight className="mx-1  sm:mx-2" />
                <a href="#" className="text-gray-700 no-underline text-sm/6 hover:text-cyan-600">Accounts</a>
              </nav>
            </div>

            <div className='border-1'></div>

            <nav className="flex gap-2 ">
              <a href="#store" className="text-sm font-semibold no-underline hover:text-cyan-500">Store</a>
              
              <a href="/pos-settings" className="text-sm font-semibold no-underline hover:text-cyan-500">Sales</a>
              
            </nav>
          </div>

          <div className="flex flex-col p-2 md:flex-row">
            {/* Left Container */}
            <div className="flex-1">
              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Store Code <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  name="storeCode"
                  value={formData.storeCode}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Store Name <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Mobile <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Email <span className='text-red-500'>*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Tax Number</label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Store Website</label>
                <input
                  type="text"
                  name="storeWebsite"
                  value={formData.storeWebsite}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <label className="block text-sm font-medium">Show Signature on Invoice</label>
                <input type="checkbox" className="mt-1" />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mb-5 mr-4 text-sm font-medium text-right">Store Logo</label>
                <div className="w-2/3">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="mt-1 text-sm text-right text-red-500">
                    Max Width/Height: 1000px * 1000px & Size: 1024kb
                  </p>
                </div>
              </div>

              <div className='w-64 min-h-40 border-3 lg:ml-60'>
                <img src={img1} alt="No Logo" />
              </div>
            </div>

            {/* Right Container */}
            <div className="flex-1 p-2">
              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Bank Details</label>
                <textarea
                  name="bankDetails"
                  value={formData.bankDetails}
                  onChange={handleChange}
                  className="w-2/3 h-12 p-2 border border-gray-300 rounded"
                ></textarea>
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">State</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-2/3 h-10 p-2 border border-gray-300 rounded"
                >
                  <option>-Select-</option>
                  <option>Andhra Pradesh</option>
                  <option>Arunachal Pradesh</option>
                  <option>Assam</option>
                  <option>Bihar</option>
                  <option>Chhattisgarh</option>
                  <option>Goa</option>
                  <option>Gujarat</option>
                  <option>Haryana</option>
                  <option>Himachal Pradesh</option>
                  <option>Jharkhand</option>
                  <option>Karnataka</option>
                  <option>Kerala</option>
                  <option>Madhya Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Manipur</option>
                  <option>Meghalaya</option>
                  <option>Mizoram</option>
                  <option>Nagaland</option>
                  <option>Odisha</option>
                  <option>Punjab</option>
                  <option>Rajasthan</option>
                  <option>Telangana</option>
                  <option>Tripura</option>
                  <option>Uttar Pradesh</option>
                  <option>Uttarakhand</option>
                  <option>West Bengal</option>
                </select>
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">City <span className='text-red-500'>*</span></label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  className="w-2/3 h-8 p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mr-4 text-sm font-medium text-right">Address <span className='text-red-500'>*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-2/3 h-12 p-2 border border-gray-300 rounded"
                ></textarea>
              </div>

              <div className="flex items-center justify-end mb-1">
                <label className="block w-1/3 mb-5 mr-4 text-sm font-medium text-right">Store Logo</label>
                <div className="w-2/3">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="mt-1 text-sm text-right text-red-500">
                    Max Width/Height: 1000px * 1000px & Size: 1024kb
                  </p>
                </div>
              </div>

              <div className='w-64 lg:ml-40 min-h-40 border-3'>
                <img src={img2} alt="No Image" />
              </div>
            </div>
          </div>
            {/* Buttons */}
        <div className="flex flex-col justify-center gap-2 mt-4 md:flex-row">
            <button className="w-full px-24 py-2 text-white bg-green-600 md:w-auto hover:bg-green-700">Save</button>
            <button className="w-full px-24 py-2 text-white bg-orange-500 md:w-auto hover:bg-orange-600">Close</button>
          </div>
        </div>
        
      </div>
      
    </div>
  );
};

export default StoreForm;
