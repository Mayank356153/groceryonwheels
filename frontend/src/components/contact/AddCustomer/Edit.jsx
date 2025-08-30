import React, { useEffect, useState } from 'react';
import Button from '../Button';
import Input from '../Input';

import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../../Loading';
export default function Edit({formData,setFormData,setActiveTab ,id}) {
        
     
const navigate=useNavigate()
   const[copy,setCopy]=useState(false)
    const[loaidng,setLoading]=useState(false)
   
     
        useEffect(() => {
         if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(async (pos) => {
             const { latitude, longitude } = pos.coords;
             setFormData((prev)=>({
                 ...prev,
                  locationLink: `https://www.google.com/maps?q=${latitude},${longitude}`
               }))
     
     
           }, (err) => {
             console.error("Geolocation denied or failed:", err);
           });
         } else {
           alert("Geolocation is not supported by this browser.");
         }
       }, []);

       const fetchLocation=()=>{
         if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(async (pos) => {
             const { latitude, longitude } = pos.coords;
             setFormData((prev)=>({
                 ...prev,
                  locationLink: `https://www.google.com/maps?q=${latitude},${longitude}`
               }))
     
     
           }, (err) => {
             console.error("Geolocation denied or failed:", err);
           });
         } else {
           alert("Geolocation is not supported by this browser.");
         }
       }
        
      
    
     
      const postData = async () => {
        setLoading(true)
            try {
              console.log("Sending FormData:", formData);
              const response = await axios.post(
                "/api/customer-data/create",
                formData,
                {
                  headers: {
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              console.log("Response:", response.data);
              alert(" Added Successfully");
              setFormData({
                 customerName: '',
      mobile: '',
    type:"Online",

      
      // address
      city:"",
        state:"",
        postcode:"",
        locationLink:"",
        country:"",
        area:"",

        //country
        
      shippingcountry:"",
      shippingCity:"",
      shippingArea:"",
      shippingState:"",
      shippingPostcode:"",
      shippingLocationLink:"",


        
        attachmentPath: "",
        creditLimit: 0,
        customerImage:"",
        customerId:'',
        email: '',
        gstNumber: '',
        openingBalancePayments:[],
         panNumber:"",
         phone:"",
         previousDue:0,
         priceLevel:0,
         priceLevelType:"",
         salesReturnDue:0,
         taxNumber:""
              })
            } catch (err) {
              console.error("Error:", err.response?.data || err.message);
              alert("Unsuccessful: " + (err.response?.data?.message || err.message));
            }
            finally{
                setLoading(false)
            }
            
          };

           const updateData = async (id) => {
                  setLoading(true)
                      try {
                        console.log("Updating FormData:", formData);
                        const response = await axios.put(
                          `/api/customer-data/${id}`,
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


                      // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
       
        if(id){
            updateData(id);
        }
        else{
            
            postData();
        }
        // Handle form submission logic here (e.g., send data to an API)
    };

    
//Function to handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]:(e.target.type=="Number")? Number(value):value });
    };
//Function to handle change in select inputs
    const handleSelectChange = (name,category) => (selectedOption) => {
        setFormData((prev)=>({ ...prev, [category]:{...prev[category],[name]:selectedOption.value,} }));
    };
    const handleAddress = (e,category) =>  {
        const{name,value}=e.target
        // console.log(category)
        setFormData((prev)=>({ ...prev, [category]:{...prev[category],[name]:value,} }));
    };
    
//Function to handle file input changes
    const handleFileChange = (e) => {
        setFormData({ ...formData, attachmentPath: e.target.files[0].name });
    };
//Function to handle chackbox changes
const handleCheckboxChange = () => {
    setCopy((prevCopy) => {
      const newCopy = !prevCopy;
  
      setFormData((prevData) => ({
        ...prevData,
        shippingcountry: newCopy ? prevData.country : '',
        shippingCity: newCopy ? prevData.city : '',
        shippingArea: newCopy ? prevData.area : '',
        shippingState: newCopy ? prevData.state : '',
        shippingPostcode: newCopy ? prevData.postcode : '',
        shippingLocationLink: newCopy ? prevData.locationLink : ''
      }));
  
      return newCopy;
    });
  };
  


   

    const handleReset=()=>{
        setFormData({
           
              attachmentPath: "",
              creditLimit: 0,
              customerImage:"",
              customerName: '',
              customerId:'',
              email: '',
              gstNumber: '',
              mobile: '',
              openingBalancePayments:[],
               panNumber:"",
               phone:"",
               previousDue:0,
               priceLevel:0,
               priceLevelType:"",
               salesReturnDue:0,
              
               taxNumber:"",


                // address
      city:"",
      state:"",
      postcode:"",
      locationLink:"",
      country:"",
      area:"",

      //country
      
    shippingcountry:"",
    shippingCity:"",
    shippingArea:"",
    shippingState:"",
    shippingPostcode:"",
    shippingLocationLink:"",

        })
    }

    return (
        <div className="p-6 mx-auto bg-white b">
            <form onSubmit={handleSubmit} onReset={handleReset}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                        label="Customer Name"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="Mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="GST Number"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="TAX Number"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                    />
                    <Input
                        label="Credit Limit"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                        type='Number'
                        min='0'
                    />
                    <Input
                    type="number"
                        label="Previous Due"
                        name="previousDue"
                        value={formData.previousDue}
                        onChange={handleChange}
                        className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                        label_class='block text-sm font-medium text-gray-700'
                        div_class='flex flex-col'
                        
                        min='0'
                    />
                    <div>
                        <Input
                            type="file"
                            label="Attachment"
                            onChange={handleFileChange}
                            className='w-full p-2 mt-1 text-gray-700 bg-gray-200 border rounded-md shadow-sm cursor-pointer hover:bg-gray-300'
                            label_class='block text-sm font-medium text-gray-700'
                        />
                        <p className="text-xs text-red-500">Size: 2MB</p>
                        {/* <Button className="mt-2 bg-green-500 text-white px-2 py-2 font-bold text-[10px]  cursor-pointer hover:bg-green-600 rounded-md" text="Click to view" /> */}
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex items-center mb-2">
                        <i className="mr-2 text-green-500 fas fa-map-marker-alt"></i>
                        <span className="font-semibold text-green-500">ADDRESS DETAILS</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                            label="Country"
                            name="country"
                            onChange={handleChange}
                            value={formData.country || formData.address?.country ||""}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />
                        <Input
                            label="State"
                            name="state"
                            onChange={handleChange}
                            value={formData.address?.state || formData.state ||""}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />
                        <Input
                            label="City"
                            name="city"
                            onChange={handleChange}
                            value={formData.address?.city || formData.city ||""}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />
                        <Input
                            label="Postcode"
                            name="postcode"
                            value={formData.address?.postcode || formData.postcode ||""}
                            onChange={handleChange}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />

                       <div className="flex items-end gap-2">
  <div className="flex-1">
    <Input
      label="Location Link"
      name="locationLink"
      value={formData.address?.locationLink || formData.locationLink || ""}
      onChange={handleChange}
      className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
      label_class='block text-sm font-medium text-gray-700'
      div_class='flex flex-col'
    />
  </div>
  <button 
    type="button" onClick={()=>fetchLocation()}
    className="h-10 px-3 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    Refresh
  </button>
</div>
                       
                        <div className='flex flex-col'>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                id="address"
                                name="area"
                                value={formData.address?.area|| formData.area ||""}
                                onChange={handleChange}
                                className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div className="py-4 mx-auto bg-white">
                    <div className='flex items-center gap-2 mb-4'>
                        <i className="text-green-500 fas fa-truck"></i>
                        <h2 className="text-lg font-semibold text-green-500">SHIPPING ADDRESS</h2>
                    </div>
                    <div className="mb-4">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-green-500 form-checkbox"
                                
                                onChange={()=>handleCheckboxChange(copy)}
                            />
                            <span className="ml-2 text-gray-700">Copy Address?</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                       
                    <Input
                            label="Country"
                            name=" shippingcountry"
                            onChange={handleChange}
                            value={formData.shippingAddress?.country || formData.shippingcountry ||""}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />
                        <Input
                            label="State"
                            name="shippingState"
                            onChange={handleChange}
                            value={formData.shippingAddress?.state || formData.shippingState ||""}
                            className='block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-sm font-medium text-gray-700'
                            div_class='flex flex-col'
                        />
                        <Input
                            label="Postcode"
                            name="shippingPostcode"
                            value={formData.shippingAddress?.postcode|| formData.shippingPostcode ||""}
                            onChange={handleChange}
                            className='block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-gray-700'
                        />
                        <Input
                            label="City"
                            name="shippingCity"
                            value={formData.shippingAddress?.city || formData.shippingCity ||""}
                            onChange={handleChange}
                            className='block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-gray-700'
                        />
                        <Input
                            label="Location Link"
                            name="shippingLocationLink"
                            value={formData.shippingAddress?.locationLink || formData.shippingLocationLink ||""}
                            onChange={handleChange}
                            className='block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600'
                            label_class='block text-gray-700'
                        />
                        <div>
                            <label className="block text-gray-700">Address</label>
                            <textarea
                                name="shippingArea"
                                value={formData.shippingAddress?.area || formData.shippingArea||""}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-2 focus:border-blue-600"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center gap-2 mt-6 mb-2 md:flex-row md:gap-5">
                         <Button className="px-20 py-2 text-white bg-green-500 rounded hover:bg-green-600" type='submit' text={id?"Update":"Save"} />
                         <Button className="px-20 py-2 text-white bg-orange-500 rounded hover:bg-orange-600" text="Close" type='reset' />
                </div>
            </form>
            <div className="w-full overflow-hidden bg-white border-t-4 rounded-lg shadow-md border-t-blue-600">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-blue-600">Opening Balance Payments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-separate">
                        <thead>
                            <tr className="w-full text-sm leading-normal text-gray-600 uppercase bg-gray-200">
                                <th className="px-6 py-3 text-left">#</th>
                                <th className="px-6 py-3 text-left">Payment Date</th>
                                <th className="px-6 py-3 text-left">Payment</th>
                                <th className="px-6 py-3 text-left">Payment Type</th>
                                <th className="px-6 py-3 text-left">Payment Note</th>
                                <th className="px-6 py-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-light text-gray-600">
                            <tr>
                                <td colSpan="6" className="px-6 py-3 text-center">No Previous Stock Entry Found!!</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}