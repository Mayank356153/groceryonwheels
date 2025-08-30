// src/components/CreateUser.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Select from 'react-select'
const CreateRiderCommission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id"); 
       // for editing existing user
  const role = localStorage.getItem("role");  // "admin" or "storeAdmin"
  const assignedStore = localStorage.getItem("storeId"); // set at login for store‑admins

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);
 
  useEffect(()=>{
   
  const fetchusers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch("api/rider-commission/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
        
      // unwrap into a flat array
      const all = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : [];
         console.log(all)
      // **now just use what the backend sent you**
      const found=all.find(m=>m._id===editId)
      console.log("AAAaa")
      console.log(found)
      setFormData(found);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }; 
  if(editId){
    
      fetchusers();
  }
  },[editId])
  
  const [stores, setStores] = useState([]);

 
  const [storeGroup, setStoreGroup] = useState(
    role === "storeAdmin" && assignedStore ? [assignedStore] : []
  );
 const[isSidebarOpen,setSidebarOpen]=useState(true)
 const[loading,setLoading]=useState(false)
 const[storeOption,setStoreOption]=useState([])
  const[formData,setFormData]=useState({
   storeId:"",
   totalAmount:0,
   moneyBreakdown:[]
  })

  const[reason,setReason]=useState("")
  const[amount,setAmount]=useState(0)

  const handleChange=(e)=>{
    const{name,value}=e.target
    setFormData((prev)=>({
        ...prev,
        [name]:(e.target.type==="number")?Number(value):value
    }))
  }


  const addBreakdown=(e)=>{
    e.preventDefault();
    setFormData((prev)=>({
        ...prev,
        moneyBreakdown:[
            ...prev.moneyBreakdown ||[],
            {
                reason:reason,
                amount:amount
            }
        ]
    }))
    setReason("")
    setAmount(0)
  }



  const deletemoney = (indexi)=>{
            const filt=formData.moneyBreakdown.filter((ind,index)=> index!==indexi)
            setFormData((prev)=>({
                ...prev,
                moneyBreakdown:filt
            }))
  }


  const handleSubmit=async(e)=>{
     e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Build payload for backend
     

      if (editId) {
        // Update existing warehouse
        await axios.put(
          `api/rider-commission/${editId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert(" updated successfully!");
      } else {
        // Create new warehouse
        console.log(formData)
        const res=await axios.post(
          "api/rider-commission/create",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(res)
        setFormData(
            {
                 storeId:"",
   totalAmount:0,
   moneyBreakdown:[]
            }
        )
        alert("created successfully!");
      }
    } catch (error) {
      console.error("Error submitting rider commission:", error);
      alert("Error submitting rider commission");
    } finally {
      setLoading(false);
    }
  }

  
  // fetch lookups
  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    const headers = { Authorization: `Bearer ${token}` };

    axios.get("admin/store/add/store", { headers })
      .then(r => setStores(r.data.result || []))
      .catch(console.error);
      setLoading(false)
  }, [navigate]);


  useEffect(()=>{
    
    const storeformat=stores.map(store=>({
        label:store.StoreName,
        value:store._id
    }))
  
    
    setStoreOption(storeformat)
  },[stores])

  useEffect(()=>console.log(formData),[formData])
  
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div>
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
             <form  className="flex-grow p-6 overflow-auto bg-gray-100" onSubmit={handleSubmit}>
                    <header className="flex flex-col items-center justify-between mb-4 md:flex-row">
                      <div className="flex flex-col items-baseline gap-2">
                        <h1 className="text-2xl font-bold">
                          {editId ? "Edit Rider Commission Model" : "Create Rider Commission Model"}
                        </h1>
                        <p className="text-gray-600">{editId ? "Modify details" : "Fill in details"}</p>
                      </div>
                      <nav className="flex items-center text-gray-500">
                        <NavLink to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-gray-800">
                          <FaTachometerAlt className="mr-1"/> Home
                        </NavLink>
                        <BiChevronRight className="mx-2"/>
                        <NavLink to="/rider-commission/view" className="text-gray-500 no-underline hover:text-gray-800">Rider Commission List</NavLink>
                      </nav>
                    </header>
          
                     {/* //store select */}
                        <div className="flex flex-col gap-5 p-2 bg-white rounded-md md:flex-row">
                            <div className="flex flex-col w-full">
                                <label htmlFor="Store" className="text-xl font-semibold">Store</label>
                                <Select className="w-full" placeholder="Select Store" options={storeOption} onChange={(option)=>setFormData((prev)=>({...prev,storeId:option.value}))}   value={storeOption.find(option => option.value === (formData.storeId?._id || formData.storeId)) || null}/>
                            </div>
                            <div className="flex flex-col w-full">
                                  <label htmlFor="totalamount" className="text-xl font-semibold">Total Amount</label>
                                  <input type="Number" min='0'value={formData.totalAmount} name="totalAmount" className="px-1 py-2 border-2 rounded-md" placeholder="Enter  Total Amount" onChange={handleChange}/>
                            </div>
                      </div>

                      
                        <div className="flex flex-col gap-5 p-2 mt-5 bg-white rounded-md md:flex-row">
                         <div className="flex flex-col w-full">
                                <label htmlFor="reason" className="text-xl ">Reason</label>
                                <input type="text" name="reason" className="px-1 py-2 border-2 rounded-md"  value={reason} onChange={(e)=>setReason(e.target.value)}/>
                            </div>
                            <div className="flex flex-col w-full">
                                  <label htmlFor="amount" className="text-xl font-semibold">Amount</label>
                                  <input type="Number" min='0'value={amount} name="amount" className="px-1 py-2 border-2 rounded-md" placeholder="Enter Amount" onChange={(e)=>setAmount(Number(e.target.value))}/>
                            </div>
                      </div>
                       {/* <div className="flex justify-center gap-4 mt-6">
            <button className="px-8 py-2 text-white bg-green-600 rounded" type="button" onClick={addBreakdown}>
              Add
            </button>
            <button
              type="button" onClick={()=>{
                setReason('')
                setAmount(0)
              }}
            
              className="px-8 py-2 text-white bg-orange-500 rounded"
            >
              Reset
            </button>
          </div> */}
                <div className="flex flex-col justify-center gap-4 mt-6 md:flex-row">
  <button
    className="flex items-center gap-2 px-6 py-2 text-white transition-colors duration-200 rounded-lg shadow-md bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 active:bg-emerald-700"
    type="button" 
    onClick={addBreakdown}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
    Add Breakdown
  </button>
  
  <button
    type="button"
    onClick={() => {
      setReason('')
      setAmount(0)
    }}
    className="flex items-center gap-2 px-6 py-2 text-white transition-colors duration-200 rounded-lg shadow-md bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 active:bg-amber-700"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
    Reset Fields
  </button>
</div>      
                      
                   <div className="w-full mt-5 overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-200">
  {/* <div className="overflow-x-auto"> */}
    
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
            Reason
          </th>
          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
            Amount
          </th>
          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {
            formData.moneyBreakdown?.length===0 && (
        <tr className="transition-colors duration-150 hover:bg-gray-50">
          <td className="px-6 py-4 text-xl text-center text-gray-900 whitespace-nowrap" colSpan='5'>
                 Nothing is added
            </td>
                </tr>
            )
        }
        {
            formData.moneyBreakdown?.length>0 &&
            formData.moneyBreakdown?.map((info,index)=>(
  <tr className="transition-colors duration-150 hover:bg-gray-50">
          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
            {info.reason || "NA"}
          </td>
          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
            <div className="flex items-center">
              <span>{info.amount}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
            <div className="flex justify-end space-x-3">
            
              <button className="text-red-600 transition-colors hover:text-red-900" onClick={()=>deletemoney(index)} type="button">
                Delete
              </button>
            </div>
          </td>
        </tr>
            ))
        }
      
       
      </tbody>
    </table>
  </div>

    <div className="flex flex-col justify-center gap-4 mt-8 md:flex-row">
  <button
    type="submit"
    className="px-6 py-2.5 text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 active:translate-y-0 flex items-center gap-2"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-5 h-5" 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      {editId ? (
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      )}
    </svg>
    {editId ? "Update Commission" : "Create Commission"}
  </button>
  
  <button
    type="button"
    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-30 active:bg-gray-100 flex items-center gap-2"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-5 h-5" 
      viewBox="0 0 20 20" 
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
    Back to Dashboard
  </button>
</div>
  
{/* </div> */}
                   </form>        
            
       
      </div>
    </div>
 
  );
};

export default CreateRiderCommission;
