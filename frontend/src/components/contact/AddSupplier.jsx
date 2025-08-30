
import React,{useEffect, useState} from 'react'
import Button from './Button';
import Input from './Input'
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { NavLink } from 'react-router-dom';
import {FaTachometerAlt} from "react-icons/fa";
import axios from 'axios';
import { useId } from 'react';
import Select from 'react-select'
import { useSearchParams } from 'react-router-dom';
import LoadingScreen from '../../Loading';
export default function AddSupplier() {
  // State management for sidebar toggle and form data
  const[isSidebarOpen,setSidebarOpen]=useState(true)
  const id=useId();
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[window.innerWidth])
  const[loading,setLoading]=useState(false)
  const [searchParams] = useSearchParams();
  const ID=searchParams.get("id")

 
const[stateOptions,setStateOptions]=useState([])
const[countryOptions,setCountryOptions]=useState([])
  
  // Main form data state object
  const [formData, setFormData] = useState({
    supplierName: "",  // Ensure this is provided
  email: "",  // Email is required
  mobile: "",  // Ensure correct format
  phone: "", 
  address: "",
  city: "",
  state: "",  // State must not be empty
  country: "",  // Country must not be empty
  gstNumber: "",
  taxNumber: "",
  openingBalance: 0,
  previousBalance: 0,
  purchaseDue: 0,
  purchaseReturnDue: 0,
  status: "Active"
  });
  const fetchCountry = async () => {
    try {
      const response = await axios.get(
        'api/countries',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );
    const newcountry=response.data.data.filter(country=> country.status==="active").map((country)=>(
      {
            label:country.countryName,
            value:country.countryName
        }
    ))

    setCountryOptions(newcountry)
    } catch (err) {
      console.log(err.message);
    } 
  };
   const fetchState = async () => {
          try {
            const response = await axios.get(
              'api/states',
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
              }
            );
          //   setSale(response.data.data)
          console.log(response.data)
          const newcountry=response.data.data.filter(country=> country.status==="active").map((country)=>(
            {
                  label:country.stateName,
                  value:country.stateName
              }
          ))
          console.log(newcountry)
          setStateOptions(newcountry)
          } catch (err) {
            console.log(err.message);
          } 
        };
  const fetchData = async (ID) => {
    setLoading(true)
    try {
      const response = await  axios.get(`api/suppliers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
        }
      }) // Replace with actual API URL
      
      console.log(response.data)
      const data=response.data.data.find((item)=>item._id===ID)
      console.log(data)
      setFormData(data)
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };
useEffect(()=>{
  if(ID){
    fetchData(ID);
    
  }
  fetchCountry();
  fetchState();
},[ID])
  

  // State for previous stock entries
  const [previousStock, setPreviousStock] = useState();

  // Handle input changes for form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (e.target.type=='number')?Number(value):value,
    });
  };

  //Handle Option Change
  const handleSelectChange = (name) => (selectedOption) => {
    setFormData({ ...formData, [name]: selectedOption.value }); // Update the corresponding field in formData
  };
   
  const updateData = async (ID) => {
    setLoading(true)
        try {
          console.log("Updating FormData:", formData);
          const response = await axios.put(
            `api/suppliers/${ID}`,
            formData,
            {
              headers: {
                "Content-Type": "application/json", 
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          console.log("Response:", response.data);
          alert(" Update Successfully");
        } catch (err) {
          console.error("Error:", err.response?.data || err.message);
          alert("Unsuccessful: " + (err.response?.data?.message || err.message));
        }
        finally{
            setLoading(false)
        }
        
      };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    if(ID){
      updateData(ID)
    }
   else{ 
    try {
      const response = await axios.post(
        "api/suppliers",
        formData,{
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Get token from localStorage
          }
        }
      );

      console.log("Supplier Added:", response.data);
      alert("Supplier added successfully!");
        // **Reset form data after successful submission**
    setFormData({
      supplierName: "",
      email: "",
      mobile: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      gstNumber: "",
      taxNumber: "",
      openingBalance: 0,
      previousBalance: 0,
      purchaseDue: 0,
      purchaseReturnDue: 0,
    });
    } catch (error) {
      console.error("Error adding supplier:", error.response?.data || error);
      alert("Failed to add supplier!");
    }
    
  }
     };
  

  return (
    <div className='flex flex-col h-screen'>
      {/* Top navigation bar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className='box-border flex'>
        {/* Sidebar component */}
        <div className='w-auto h-auto '>
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        
        {/* Main content area */}
        <div className='w-full h-full px-6 py-4 overflow-x-auto bg-gray-300'>
          {/* Page header and breadcrumb navigation */}
          <div className='flex flex-col items-end justify-between md:flex-row'>
            <div className='flex items-end w-full gap-2 md:w-1/2'> 
              <span className='text-3xl'>Suppliers</span>
              <span className='text-sm text-gray-700 '>Add/Update Supplier</span>               
            </div>  
            <div className='flex w-full gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
              <span>&gt;</span>
              <NavLink to="/contact/" className="text-gray-700 no-underline">Import Suppliers</NavLink>
              <span>&gt;</span>
              <NavLink to="/supplier/add" className="text-gray-700 no-underline">Add Suppliers</NavLink>                   
            </div>
          </div>

          {/* Main supplier form */}
          <form onSubmit={handleSubmit}> 
            {/* Form container with blue top border */}
            <div className="px-2 py-4 mx-auto bg-white border-t-4 rounded-t-md border-t-blue-600 border-opacity-70">
              
              {/* Responsive form grid layout */}
              <div className="grid grid-cols-1 md:gap-5 md:grid-cols-2">
                {/* Supplier Name Input */}
                <Input 
                  div_class="flex items-center mb-5 lg:mb-2" 
                  label_class="w-1/3 text-gray-700" 
                  name="supplierName"
                  label="Supplier Name*" 
                  value={formData.supplierName ||""}
                  onChange={(e)=>handleChange(e)}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />
                
                {/* Opening Balance Input */}
                <Input  type='Number' min="0"
                  div_class="flex items-center mb-5 lg:mb-2" 
                  label_class="w-1/3 text-gray-700" 
                  label="Opening Balance"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleChange} 
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* Mobile Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Mobile" 
                  name="mobile"
                  placeholder='3452345' 
                  value={formData.mobile}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />


                  <Input type='Number' min='0'
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Purchase Due" 
                  name="purchaseDue"
                  value={formData.purchaseDue}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />


                  <Input type='Number' min='0'
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Previous Balance" 
                  name="previousBalance"
                   
                  value={formData.previousBalance}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />


                 <Input type='Number' min='0'
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Purchase Return Due" 
                  name="purchaseReturnDue"
                  
                  value={formData.purchaseReturnDue}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* Country Selection Dropdown */}
                <div className="flex items-center w-full mb-5 ">
                  <label htmlFor="country" className="w-1/3 text-gray-700">Country</label>
                  
                  <Select options={countryOptions} className='w-2/3' onChange={handleSelectChange("country")}
                  value={countryOptions.find(option => option.value === formData.country) || null}/>
                </div>
                
                {/* Email Input */}
                <Input 
                  div_class="flex items-center  mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Email" 
                  name="email"
                  className='w-2/3 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-700' 
                  type='email'
                  value={formData.email}
                  onChange={handleChange} 
                />

                {/* State Selection Dropdown */}
                <div className="flex items-center w-full mb-5">
                  <label htmlFor="state" className="w-1/3 text-gray-700">State</label>
                  <Select options={stateOptions} className='w-2/3' onChange={handleSelectChange("state")} 
                          value={stateOptions.find(option => option.value === formData.state) || null}/>                        

                </div>
                
                {/* Phone Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Phone" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* City Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="City" 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* GST Number Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="GST Number" 
                  name="gstNumber"
                  value={formData.gstNumber} 
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* Postcode Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Postcode"
                  name="postcode" 
                  value={formData.postcode}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* Tax Number Input */}
                <Input 
                  div_class="flex items-center mb-5" 
                  label_class="w-1/3 text-gray-700" 
                  label="Tax Number" 
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  className='w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500' 
                />

                {/* Address Textarea */}
                <div className="flex items-center mb-5">
                  <label htmlFor="address" className="w-1/3 text-gray-700">Address</label>
                  <textarea 
                    id="address" 
                    className="w-2/3 p-2 border border-gray-300 rounded outline-none focus:border-blue-500" 
                    value={formData.address} 
                    name="address" 
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
              
              {/* Form action buttons */}
              <div className="flex flex-col justify-center gap-2 mt-6 md:flex-row md:gap-5">
                <Button className="px-20 py-2 text-white bg-green-500 rounded" type='submit' text={ID?"Update":"Save"} />
                <Button className="px-20 py-2 text-white bg-orange-500 rounded" text="Close" type='reser' />
              </div>
            </div>
          </form>

          {/* Opening Balance Payments Section */}
          <div className='w-full mt-20 bg-white border-t-4 border-b-2 rounded-sm border-t-gray-500 border-b-gray-500'>
            <h2 className='px-4 py-1 text-sm text-blue-500 md:text-lg'>Opening Balance Payments</h2>
            <div className='overflow-x-auto '>
              {/* Payments history table */}
              <table className='w-full border-separate'>
                <thead className='text-sm'>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-4 py-2 text-left">Payment Date</th>
                    <th className="px-4 py-2 text-left">Payment</th>
                    <th className="px-4 py-2 text-left">Payment Type</th>
                    <th className="px-4 py-2 text-left">Payment Note</th>
                    <th className="hidden px-4 py-2 text-left sm:table-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='text-left'>
                    <td colSpan='6' className="px-4 py-2 text-center">
                      {previousStock ? previousStock : <span>No Previous Stock entry found!!!</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


        
      </div>
    </div>
  )
}