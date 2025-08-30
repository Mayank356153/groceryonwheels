// components/MessageTemplatesList.jsx
import React, { useState ,useEffect} from 'react';
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import { useNavigate } from 'react-router-dom';

const MessageTemplatesList = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
   
  // This is just sample data. Replace with real data if you fetch from an API.
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "GREETING TO CUSTOMER ON SALES",
      content: "Hi {{customer_name}}, Your sales Id is {{sales_id}}, Sales Date {{sales_date}}, Total amount {{sales_amount}}, You have paid {{paid_amt}}, and due amount is {{due_amt}} Thank you Visit Again",
      status: "active",
    },
    {
      id: 2,
      name: "GREETING TO CUSTOMER ON SALES RETURN",
      content: "Hi {{customer_name}}, Your sales return Id is {{return_id}}, Return Date {{return_date}}, Total amount {{return_amount}}, We paid {{paid_amt}}, and due amount is {{due_amt}} Thank you Visit Again",
      status: "active",
    },
    {
      id: 3,
      name: "OTP TEMPLATE #1",
      content: "Dear {#var#} {#var#} is the OTP for your login at Grocery on wheels. In case you have not requested this, please contact us at contact@inspiredgrow.in - INSPGD",
      status: "active",
    },
    {
      id: 4,
      name: "OTP TEMPLATE #2",
      content: "Dear {#var#} your login OTP is {#var#}, regards inspired grow.",
      status: "active",
    },
    {
      id: 5,
      name: "Promotional Template",
      content: "Hi, this is Grocery on Wheels! We would like to offer you a hassle-free grocery shopping experience. Simply call us at 9050092092 and book our van for doorstep delivery of your groceries. Our team will take care of the rest. Thank you for choosing Grocery on Wheels! - INSPGD",
      status: "active"
    }
  ]);
   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[])
  const [showUpload, setShowUpload] = useState(null); // Track which action button is clicked

  // State to track if the user clicked "Action" for a specific template (you had this logic for file uploads)
  const toggleUpload = (id) => {
    setShowUpload(showUpload === id ? null : id);
  };

  // useNavigate allows us to programmatically navigate
  const navigate = useNavigate();

  // If user clicks "Use Template," navigate to the SendMessage page
  // passing the template content as route state
  const handleUseTemplate = (templateContent) => {
    navigate('/send-message', {
      state: {
        templateContent: templateContent
      }
    });
  };

  return (
    <div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                
              {/* Sidebar component with open state */}
              <div className="w-auto">
              <Sidebar isSidebarOpen={isSidebarOpen} />
              </div>
                
                 {/* Content */}
         <div className={`overflow-x-auto w-full flex flex-col p-2 md:p-2 min-h-screen `}>
           <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row bg-gray">
                <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
                  <h1 className="text-lg font-semibold truncate sm:text-xl">Message Templates List</h1>
                  <span className="text-xs text-gray-600 sm:text-sm">View/Search Template</span>
                </div>
    
                <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                  <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600"><FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home</a>
                  <BiChevronRight className="mx-1 sm:mx-2" />
                  <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">Message Templates List</a>
                </nav>
      </header>
      <div className="flex justify-between mt-4 mb-2">
        <div>
          <label htmlFor="entries" className="mr-2">
            Show
          </label>
          <select id="entries" className="p-1 border rounded">
            <option value="10">10 entries</option>
          </select>
        </div>
        <input type="text" placeholder="Search..." className="p-1 border rounded" />
      </div>
     <div className='overflow-x-auto'>
      <table className="min-w-full bg-white border-collapse rounded-lg shadow-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">Template Name</th>
            <th className="px-4 py-2 border">Content</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id} className="border-b">
              <td className="px-4 py-2 border">{template.id}</td>
              <td className="px-4 py-2 border">{template.name}</td>
              <td className="px-4 py-2 border">{template.content}</td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded-lg ${template.status === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-2 text-center border">
                <button
                  onClick={() => toggleUpload(template.id)}
                  className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
                >
                  Action
                </button>
                {showUpload === template.id && (
                  <input type="file" className="block mt-2" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="flex flex-col justify-between mt-4 md:flex-row">
        <div>
          Showing 1 to 2 of 2 entries (filtered from 12 total entries)
        </div>
        <div>
          <button className="px-2 py-1 mr-2 text-gray-700 bg-gray-300 rounded">Previous</button>
          <button className="px-4 py-1 text-white bg-indigo-500 rounded">1</button>
          <button className="px-2 py-1 ml-2 text-gray-700 bg-gray-300 rounded">Next</button>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default MessageTemplatesList;