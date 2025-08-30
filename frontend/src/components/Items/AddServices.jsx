// import React,{useEffect, useState} from 'react'
// import Navbar from '../Navbar';
// import Sidebar from '../Sidebar';
// import { useNavigate } from 'react-router-dom';
// import { NavLink } from 'react-router-dom';
// import { FaTachometerAlt } from 'react-icons/fa';
// import Input from '../contact/Input';
// import Button from '../contact/Button';
// import Select from 'react-select'
// import Scanner from './Scanner';
// import axios from 'axios';
// import LoadingScreen from '../../Loading';
// export default function AddService() {
//   // State to manage the active tab (Edit or Advanced)
//   const[activeTab,setActiveTab]=useState("Edit");
//   // State to manage the sidebar open/close status
//   const[isSidebarOpen,setSidebarOpen]=useState(true);
//  const [options, setOptions] = useState({
//     Brand: [
//       { label: "arhar", value: "Arhar" },
//       { label: "BrandLocal", value: "Brand Local" },
//       { label: "itc", value: "Itc" },
//       { label: "keshav", value: "Keshav" }
//     ],
//     Category: [
//       { value: "bath&body", label: "Bath & Body" },
//       { value: "oil,masala,sauce", label: "Oil, Masala & Sauces" },
//       { value: "dailyEssentials", label: "Daily Essentials" },
//       { label: "Staples", value: "Staples" },
//       { label: "Snack & Beverages", value: "Snack & Beverages" },
//       { label: "Package Food", value: "Package Food" },
//       { value: "personalcare", label: "Personal & Baby Care" },
//       { value: "householdcare", label: "HouseHold Care" },
//       { value: "dairyandegg", label: "Dairy & Eggs" }
//     ],
//     itemGroup: [
//       { label: "Single", value: "single" },
//       { label: "Variants", value: "variant" }
//     ],
//     Unit: [
//       { label: "Kilogram", value: "kg" },
//       { label: "Gram", value: "g" },
//       { label: "Litre", value: "l" },
//       { label: "Millilitre", value: "ml" },
//       { label: "Piece", value: "pcs" },
//       { label: "Dozen", value: "dozen" },
//       { label: "Packet", value: "packet" },
//       { label: "Box", value: "box" },
//       { label: "Bundle", value: "bundle" },
//       { label: "Tin", value: "tin" },
//       { label: "Bottle", value: "bottle" },
//       { label: "Carton", value: "carton" },
//       { label: "Sack", value: "sack" },
//       { label: "Can", value: "can" },
//       { label: "Bar", value: "bar" },
//       { label: "Jar", value: "jar" },
//     ],
//     Discounttype: [
//       { label: "Percentage(%)", value: "percentage" },
//       { label: "Fixed", value: "fixed" }
//     ],
//     Tax: [
//       { label: "GST", value: "gst" }
//     ],
//     TaxType: [
//       { label: "Inclusive", value: "inclusive" },
//       { label: "Exclusive", value: "exclusive" }
//     ],
//     WareHouse: [
//       { label: "Warehouse", value: "warehouse" },
//       { label: "Van 1", value: "van1" },
//       { label: "Van 2", value: "van2" },
//       { label: "Hisar Main", value: "hisarmain" },
//     ]
//   });
//   const[formdata,setFormdata]=useState({
//     itemCode:"",
//     itemName:"",
//     category:"",
//     HSN:"",
//     SAC:"",
//     sellerPoints:"0",
//     description:"",
//     image:"",
//     discountType:"",
//     discount:"",
//     expenses:"",
//     tax:"",
//     taxType:"",
//     salesPrice:""
//   })
// const handleChange=(e)=>{
//   const{name,value}=e.target;
//   setFormdata((prev)=>({
//     ...prev,
//     [name]:value
//   }))
// }
//  // Handle changes for select dropdowns
//  const handleSelectChange = (name) => (selectedOption) => {
//   setFormdata({ ...formdata, [name]: selectedOption }); // Update the corresponding field in formData
// };

// // Handle image file selection
// const handleImageChange = (e) => {
//   setFormdata({ ...formdata, image: e.target.files[0] }); // Store the selected image file
// };

// const handleSubmit=(e)=>{
//   e.preventDefault();
//   console.log(formdata)
// }

// const fetchService = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     const response = await axios.get(`api/services`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });
//     console.log(response.data)
    
   
//   } catch (err) {
//     console.log(err.message);
//   } 
// };
// useEffect(()=>{fetchService()},[])

//   return (
//     <div className='flex flex-col h-screen'>
//       {/* Navbar component with sidebar open state */}
//       <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
//       <div className='flex flex-grow mt-20'>
//         <div>
//           {/* Sidebar component with open state */}
//           <Sidebar isSidebarOpen={isSidebarOpen} />
//         </div>

//         {/* Container for the entire component */}
//         <div className='w-full h-full px-6 pb-6 bg-gray-300'>

//           <div className='flex flex-col items-start justify-between mt-4 sm:items-end md:flex-row'>
//             <div className='flex flex-wrap items-end w-full md:w-1/2'> 
//               <div>
//               <span className='text-3xl '>Customers</span>
//               </div>
//               <div>
//               <span className='text-sm text-gray-700'>Enter User Information</span>               
//               </div>
//             </div>  
//             <div className='flex flex-wrap w-auto gap-2 pl-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
//               {/* Navigation links for breadcrumb navigation */}
//               <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
              
//               <NavLink to="/customer/view" className="text-gray-700 no-underline">&gt;View Users</NavLink>
              
//               <NavLink to="/customer/add" className="text-gray-700 no-underline">&gt;Customers</NavLink>                   
//             </div>
//           </div> 
//           <form onSubmit={handleSubmit}>
//           <div className='flex flex-col w-full gap-4 px-4 pt-2 pb-6 mx-auto bg-white border-t-4 border-blue-500 rounded-md sm:gap-5'>
            
//                   <Input div_class='flex flex-col' label='Item Code*' required label_class='text-sm font-semibold'  name="itemCode"  className='px-4 py-2 mt-1 text-sm text-gray-800 border-[1px] border-gray-300 rounded-md lg:w-1/3 focus:outline-none focus:border-2 focus:border-blue-600 lg:w-1/4' value={formdata.itemCode} onChange={handleChange} />
//                   <div className='flex flex-col justify-between gap-2 sm:flex-row'>
//                     <Input label="ItemName*" value={formdata.itemName} onChange={handleChange} name="itemName" required div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
//                     <div className='flex flex-col w-full gap-1 sm:w-1/4'>
//                       <label htmlFor="" className='text-sm font-semibold' >Category</label>
//                     <Select options={options.Category} value={formdata.category} onChange={handleSelectChange('category')} />
//                     </div>
//                     <Scanner/>
//                   </div>  
//             {/* div3         */}
//             <div className='flex flex-col justify-between gap-2 sm:flex-row'>
//                     <Input label="SAC" name='SAC' value={formdata.SAC} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
//                     <Input label="HSN" div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold' name='HSN' value={formdata.HSN} onChange={handleChange}/>
//                     <Input label="Seller Points" type="number" div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold' name="sellerPoints" value={formdata.sellerPoints} onChange={handleChange}/>
//             </div>
//             {/* div4 */}
//             <div className='flex flex-col justify-between gap-2 sm:flex-row'>
//                    <div className='flex flex-col w-full sm:w-1/4'>
//                    <label  className='text-sm font-semibold'>Description</label>
//                    <textarea name="description" value={formdata.description} onChange={handleChange}  className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' ></textarea>
//                    </div>
//                    <div className='flex flex-col justify-between w-full sm:w-1/4'>
//                        <label className='text-sm font-semibold'>Select Image</label>
//                        <Input onChange={handleImageChange} type="file" className='flex flex-wrap mt-1 text-sm font-medium'/>
//                        <span className='text-sm text-red-700'>Max Width/Height: 1000px * 1000px & Size: 1MB</span>
//                    </div>
//                    <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
//                    </div>
                   
//             </div>
//             {/* div5 */}
//             <div className='flex flex-col justify-between gap-2 pt-5 border-t-2 border-gray-200 sm:py-5 sm:flex-row' >
//             <div className='flex flex-col w-full gap-1 sm:w-1/4'>
//                       <label htmlFor="" className='text-sm font-semibold'>Discount Type</label>
//                     <Select options={options.Discounttype} />
//             </div>
//             <Input label="Discount" name="discount" value={formdata.discount} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>

                   
//                    <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
//                    </div>
                   
//             </div> 
//             {/* div6            */}
//             <div className='flex flex-col justify-between gap-2 pt-5 border-t-2 border-gray-200 sm:flex-row' >
//               <div className='w-full sm:w-1/4'>
//             <Input label="Price(Expenses)*"  className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' name="expenses" value={formdata.expenses} onChange={handleChange} label_class='text-sm font-semibold'/>
//                 <span className='text-sm text-blue-700'>Enter "0",If there is no expenses</span>
//               </div>
//             <div className='flex flex-col w-full gap-1 sm:w-1/4'>
//                       <label htmlFor="" className='text-sm font-semibold'>Tax*</label>
//                     <Select options={options.Tax}  onChange={handleSelectChange("tax")}/>
//             </div>

//                    <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
//                    </div> 
                   
//             </div> 
//             <div className='flex flex-col justify-between gap-2 sm:flex-row'>
//             <div className='flex flex-col w-full gap-1 sm:w-1/4'>
//                       <label htmlFor="" className='text-sm font-semibold'>Sales Tax Type*</label>
//                     <Select options={options.TaxType} onChange={handleSelectChange("taxType")} />
//             </div>
//                     <Input label="Sales Price" name="salesPrice" value={formdata.salesPrice} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
//                     <div className='flex-col hidden w-full sm:flex sm:w-1/4'></div> 
//             </div>
//             <div className='flex flex-col justify-center gap-2 py-4 border-t-2 border-gray-200 sm:flex-row' >
//                 <Button className="w-full text-white bg-green-500 rounded cursor-pointer sm:max-w-80 hover:bg-green-600" type='submit' text="Save" /> {/* Save button */}
//                  <Button className="w-full text-white bg-orange-500 rounded cursor-pointer sm:max-w-80 hover:bg-orange-600" text="Close" /> {/* Close button */}
//             </div> 
//          </div>
//          </form>
//         </div>
//       </div>
//     </div>
//   );
// }
import React,{useEffect, useState} from 'react'
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt } from 'react-icons/fa';
import Input from '../contact/Input';
import Button from '../contact/Button';
import Select from 'react-select'
import Scanner from './Scanner';
import axios from 'axios';
import LoadingScreen from '../../Loading';
export default function AddService() {
  // State to manage the active tab (Edit or Advanced)
  // const[activeTab,setActiveTab]=useState("Edit")
  // State to manage the sidebar open/close status
  const[isSidebarOpen,setSidebarOpen]=useState(true);
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState("")
 const [options, setOptions] = useState({
    category:[],
    discounttype: [
      { label: "Percentage(%)", value: "Percentage" },
      { label: "Fixed", value: "Fixed" }
    ],
    tax: [],
    taxType: [
      { label: "Inclusive", value: "Inclusive" },
      { label: "Exclusive", value: "Exclusive" }
    ],
  });
  const[formdata,setFormData]=useState({
    barcode:"",
    category:null,
    description:"",
    discount:0,
    discountType:"",
    hsn:"",
    itemCode:"",
    itemName:"",
    priceWithoutTax:0,
    sac:"",
    salesPrice:0,
    sellerPoints:0,
    salesTaxType:"",
    serviceImage:"",
    tax:null,
  })
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const fetchCategory = async () => {
    try {
      const response = await axios.get('api/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });
  
    console.log(response.data)
      const newCategory=response.data.map((item)=>({
        label:item.name,
        value:item._id
      }))
      setOptions((prev)=>({...prev,category:newCategory}))
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchtax = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`api/taxes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data)
      const newunit=response.data.data.map((item)=>({
        label:item.taxName,
        value:item._id
      }))
     setOptions((prev)=>({...prev,tax:newunit}))
    } catch (err) {
      setError(err.message);
    } 
  };
useEffect(()=>{
  try {
    setLoading(true)
    fetchCategory();
    fetchService();
    fetchtax();
  } catch (error) {
    console.log(error)
  }
  finally{
    setLoading(false)
  }
},[])
  
const handleChange=(e)=>{
  const{name,value}=e.target;
  setFormData((prev)=>({
    ...prev,
    [name]:(e.target.type==='number')?Number(value):value
  }))
}
 // Handle changes for select dropdowns
 const handleSelectChange = (name) => (selectedOption) => {
  setFormData({ ...formdata, [name]: selectedOption.value }); // Update the corresponding field in formData
};

// Handle image file selection
const handleImageChange = (e) => {
  setFormData({ ...formdata, image: e.target.files[0].name }); // Store the selected image file
};
const postData = async () => {
  try {
   
  
    console.log("Sending FormData:", formdata);

    const response = await axios.post(
      "api/services",
      formdata,
      {
        headers: {
          "Content-Type": "application/json", // Change Content-Type
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    console.log("Response:", response.data);
    alert("Service Added Successfully");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    alert("Unsuccessful: " + (err.response?.data?.message || err.message));
  }
};
const handleSubmit= async(e)=>{
  e.preventDefault(); // Prevent default form submission behavior
    // Perform validation here (if needed)
    
    // Send formData to API or handle it as needed
    setLoading(true)
   try {
    await postData(); // ✅ Send data to backend
    console.log("Form submitted successfully!");
  } catch (err) {
    console.error("Form submission failed:", err);
  }
  finally{
    setLoading(false)
  }
  setFormData({
    barcode:"",
    category:null,
    description:"",
    discount:0,
    discountType:"",
    hsn:"",
    itemCode:"",
    itemName:"",
    priceWithoutTax:0,
    sac:"",
    salesPrice:0,
    sellerPoints:0,
    salesTaxType:"",
    serviceImage:"",
    tax:null,
  })
}
const generateItemCode = (lastItemCode) => {
  // Extract numeric part from the last item code
  const match = lastItemCode.match(/(\D+)(\d+)/);
  if(!match) return "IT050031"

  const prefix = match[1];  // "IT"
  const number = parseInt(match[2], 10) + 1; // Increment number

  return `${prefix}${number.toString().padStart(6, "0")}`; // Ensure it stays 6 digits
};

const fetchService = async () => {
  try {
    setLoading(true)
    const token = localStorage.getItem("token");
    const response = await axios.get(`api/services`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(response.data)
    if (response.data.data.length > 0) {
      // Get the latest item from the list (assuming the API returns sorted data)
      const lastItem = response.data.data[response.data.data.length - 1];  
      const lastCode = lastItem.itemCode || "IT050055"; // Default if API is empty

      setFormData((prev) => ({
        ...prev,
        itemCode: generateItemCode(lastCode),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        itemCode: "IT050060", // Default if no items exist
      }));
    }
   
  } catch (err) {
    console.log(err.message);
  } 
  finally{
    setLoading(false)
  }
};
useEffect(()=>{fetchService()},[])
if(loading) return (<LoadingScreen />)
  return (
    <div className='flex flex-col h-screen'>
      {/* Navbar component with sidebar open state */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className='flex flex-grow '>
    
          {/* Sidebar component with open state */}
          <Sidebar isSidebarOpen={isSidebarOpen} />
        

        {/* Container for the entire component */}
        <div className='w-full h-full px-6 pb-6 bg-gray-300'>

          <div className='flex flex-col items-start justify-between mt-4 sm:items-end md:flex-row'>
            <div className='flex flex-wrap items-end w-full md:w-1/2'> 
              <div>
              <span className='text-3xl '>Services</span>
              </div>
              <div>
              <span className='text-sm text-gray-700'>Add/Update Services</span>               
              </div>
            </div>  
            <div className='flex flex-wrap w-full gap-2 px-2 py-2 mb-2 text-sm font-semibold text-black bg-gray-500 bg-opacity-50 rounded-md md:text-gray-500 md:justify-end md:w-1/2 md:bg-transparent'>
              {/* Navigation links for breadcrumb navigation */}
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline"><FaTachometerAlt />Home </NavLink>
              
              <NavLink to="/services/view" className="text-gray-700 no-underline">&gt;View Services</NavLink>
              
              <NavLink to="/services/add" className="text-gray-700 no-underline">&gt;Services</NavLink>                   
            </div>
          </div> 
          <form onSubmit={handleSubmit}>
          <div className='flex flex-col w-full gap-4 px-4 pt-2 pb-6 mx-auto bg-white border-t-4 border-blue-500 rounded-md sm:gap-5'>
            
                  <Input div_class='flex flex-col' label='Item Code*' required label_class='text-sm font-semibold'  name="itemCode"  className='px-4 py-2 mt-1 text-sm text-gray-800 border-[1px] border-gray-300 rounded-md lg:w-1/3 focus:outline-none focus:border-2 focus:border-blue-600 lg:w-1/4' value={formdata.itemCode} onChange={handleChange} />
                  <div className='flex flex-col justify-between gap-2 sm:flex-row'>
                    <Input label="ItemName*" value={formdata.itemName} onChange={handleChange} name="itemName" required div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
                    <div className='flex flex-col w-full gap-1 sm:w-1/4'>
                      <label htmlFor="" className='text-sm font-semibold' >Category</label>
                    <Select options={options.category} value={formdata.category} onChange={handleSelectChange('category')}  className='w-full -z-1'/>
                    </div>
                    <Scanner formData={formdata} setFormData={setFormData}/>
                  </div>  
            {/* div3         */}
            <div className='flex flex-col justify-between gap-2 sm:flex-row'>
                    <Input label="SAC" name='sac' value={formdata.sac} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
                    <Input label="hsn" div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold' name='hsn' value={formdata.hsn} onChange={handleChange}/>
                    <Input label="Seller Points" type="number" min='0' div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold' name="sellerPoints" value={formdata.sellerPoints} onChange={handleChange}/>
                    
            </div>
            {/* div4 */}
            <div className='flex flex-col justify-between gap-2 sm:flex-row'>
                   <div className='flex flex-col w-full sm:w-1/4'>
                   <label  className='text-sm font-semibold'>Description</label>
                   <textarea name="description" value={formdata.description} onChange={handleChange}  className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' ></textarea>
                   </div>
                   <div className='flex flex-col justify-between w-full sm:w-1/4'>
                       <label className='text-sm font-semibold'>Select Image</label>
                       <Input onChange={handleImageChange} type="file" className='flex flex-wrap mt-1 text-sm font-medium'/>
                       <span className='text-sm text-red-700'>Max Width/Height: 1000px * 1000px & Size: 1MB</span>
                   </div>
                   <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
                   </div>
                   
            </div>
            {/* div5 */}
            <div className='flex flex-col justify-between gap-2 pt-5 border-t-2 border-gray-200 sm:py-5 sm:flex-row' >
            <div className='flex flex-col w-full gap-1 sm:w-1/4'>
                      <label htmlFor="" className='text-sm font-semibold'>Discount Type</label>
                    <Select options={options.discounttype} onChange={handleSelectChange('discountType')}/>
            </div>
            <Input label="Discount" type='Number' min='0' name="discount" value={formdata.discount} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>

                   
                   <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
                   </div>
                   
            </div> 
            {/* div6            */}
            <div className='flex flex-col justify-between gap-2 pt-5 border-t-2 border-gray-200 sm:flex-row' >
              <div className='w-full sm:w-1/4'>
            <Input label="Price(Expenses)*"  className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' name="priceWithoutTax" value={formdata.priceWithoutTax} onChange={handleChange} type='Number' min='0'label_class='text-sm font-semibold'/>
                <span className='text-sm text-blue-700'>Enter "0",If there is no expenses</span>
              </div>
            <div className='flex flex-col w-full gap-1 sm:w-1/4'>
                      <label htmlFor="" className='text-sm font-semibold'>Tax*</label>
                    <Select options={options.tax}  onChange={handleSelectChange("tax")}/>
            </div>

                   <div className='flex-col hidden w-full sm:flex sm:w-1/4'>
                       
                   </div> 
                   
            </div> 
            <div className='flex flex-col justify-between gap-2 sm:flex-row'>
            <div className='flex flex-col w-full gap-1 sm:w-1/4'>
                      <label htmlFor="" className='text-sm font-semibold'>Sales Tax Type*</label>
                    <Select options={options.taxType} onChange={handleSelectChange("salesTaxType")} />
            </div>
                    <Input label="Sales Price" name="salesPrice" type='Number'min='0' value={formdata.salesPrice} onChange={handleChange} div_class='flex flex-col  w-full sm:w-1/4' className='w-full px-4 py-2 mt-1 text-sm text-gray-800 border-gray-300 rounded-md border-[1px] focus:outline-none focus:border-2 focus:border-blue-600' label_class='text-sm font-semibold'/>
                    <div className='flex-col hidden w-full sm:flex sm:w-1/4'></div> 
            </div>
            <div className='flex flex-col justify-center gap-2 py-4 border-t-2 border-gray-200 sm:flex-row' >
                <Button className="w-full text-white bg-green-500 rounded cursor-pointer sm:max-w-80 hover:bg-green-600" type='submit' text="Save" /> {/* Save button */}
                 <Button className="w-full text-white bg-orange-500 rounded cursor-pointer sm:max-w-80 hover:bg-orange-600" text="Close" /> {/* Close button */}
            </div> 
         </div>
         </form>
        </div>
      </div>
    </div>
  );
}