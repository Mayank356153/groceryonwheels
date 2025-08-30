import React, { useEffect, useState } from 'react';
import Button from '../Button'; // Importing a custom Button component
import Select from 'react-select'; // Importing the Select component from react-select
import axios from 'axios';
import LoadingScreen from '../../../Loading';
export default function Advanced({formData,setFormData,id,p,l}) {
    // Options for the price type select dropdown
    const price_options = [
        {
            label: "Increase",
            value: "Increase"
        },
        {
            label: "Decrease",
            value: "Decrease"
        }
    ];
    const[loading,setLoading]=useState(false)
    // State to manage the price level and price type
    const [price_level, setPrice_level] = useState(0); // Initial price level set to 0
    const [price_type, setPrice_type] = useState(""); // Initial price type set to null
       useEffect(()=>{
        
        if(id){
            setFormData((prev)=>({
                ...prev,
                priceLevel:p,
                priceLevelType:l
            }))
        }
       },[id])
    

    const postData = async () => {
    setLoading(true)
        try {
          console.log("Sending FormData:", formData);
          const response = await axios.post(
            "api/customer-data/create",
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
        } catch (err) {
          console.error("Error:", err.response?.data || err.message);
          alert("Unsuccessful: " + (err.response?.data?.message || err.message));
        }
        finally{
            setLoading(false)
        }
        
      };
 useEffect(()=>console.log(formData),[formData])
      
    const updateData = async (id) => {
        setLoading(true)
            try {
              console.log("Updating FormData:", formData);
              const response = await axios.put(
                `api/customer-data/${id}`,
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
        console.log(price_type)
        setFormData({...formData,priceLevel:price_level,priceLevelType:price_type})
        if(id){
            updateData(id);
        }
        else{
            
            postData();
        }
        // Handle form submission logic here (e.g., send data to an API)
    };

    // Function to handle closing/resetting the form
    const handleClose = () => {
        setPrice_level(0); // Reset price level to 0
        setPrice_type(null); // Reset price type to null
    };
    if(loading) return(<LoadingScreen />)
    return (
        <div className='container w-full pt-20 mx-auto'>
            <div className="max-w-4xl p-4 mx-auto">
                <form onSubmit={handleSubmit} onReset={handleClose}>
                    <div className="p-6 bg-white rounded shadow-md">
                        {/* Price Level Type Selection */}
                        <div className="mb-4">
                            <label htmlFor="price-level-type" className="block text-gray-700">Price Level Type</label>
                            {/* Select component for choosing price type */}
                            <Select 
  options={price_options} 
  value={price_options.find(option => option.value === formData.priceLevelType) || null}
  placeholder="Select Price Type" 
  className="w-full text-sm"
  onChange={(selected) => setFormData((prev)=>({...prev,priceLevelType:selected.value}))}
/>

                        </div>
                        {/* Price Level Input */}
                        <div className="mb-4">
                            <label htmlFor="price-level" className="block text-gray-700">Price Level</label>
                            <div className="flex items-center mt-1">
                                <input 
                                    type='Number' min='0' 
                                    id="price-level" 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded" 
                                    value={formData.priceLevel} 
                                    onChange={(e) => setFormData((prev)=>({...prev,priceLevel:Number(e.target.value)}))} // Update state on input change
                                />
                                <span className="ml-2 text-blue-500">
                                    <i className="fas fa-percentage"></i> {/* Icon for percentage */}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Buttons for Save and Close */}
                    <div className="flex flex-col justify-center gap-2 mt-6">
                        <Button 
                            text={id?"Update":"Save"} 
                            type='submit' 
                            className='px-20 py-2 mr-4 font-semibold text-center text-white bg-green-500 rounded cursor-pointer hover:bg-green-600'
                        />
                        <Button 
                            text='Close' 
                            type='reset' 
                            className='px-20 py-2 mr-4 font-semibold text-center text-white bg-orange-500 rounded cursor-pointer hover:bg-orange-600'
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
