import { useState ,useEffect} from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import Select from "react-select"
const RiderAddMoney = ({ isOpen, onClose, data,rider }) => {
    const[accounts,setAccounts]=useState([])
    console.log(data)

    
  const [formData, setFormData] = useState({
       amount:"",
       riderId:rider._id,
       riderAccountId:data._id
  });





 
 

  const handleSubmit =async (e) => {
    e.preventDefault();
   
    // console.log(formData)
    try {
      const res=await axios.post(`api/rider-account/money`,formData,{
        headers:{
          Authorization:`bearer ${localStorage.getItem("token")}`
        }
      })  
      console.log(res)
      onClose();
    } catch (error) {
        console.log(error)
    }
  };


  
  if (!isOpen) return null;



  
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-55">
    {/* Semi-transparent overlay (optional) - remove or adjust opacity if you want completely transparent */}
    <div 
      className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-[1px]"
      onClick={onClose} // Optional: close when clicking outside
    ></div>
    
    {/* Modal container */}
    <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-xl">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Add Money</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 transition-colors hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Rider Name
          </label>
          <input
            type="text"
            name="riderName"
            value={`${rider.firstname} ${rider.lastname}`}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Account Number
          </label>
          <input
            type="text"
            name="accountNumber"
            value={data.accountNumber}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
        
      

         <div className="mb-6">
          <label className="block mb-1 text-sm font-medium text-gray-700">
             Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e)=>setFormData((prev)=>({...prev,amount:Number(e.target.value)}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
            min='0'
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-cyan-600 hover:bg-cyan-700"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  </div>
);




};

  export default RiderAddMoney