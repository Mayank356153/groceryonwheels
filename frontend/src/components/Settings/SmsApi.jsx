import React, { useState ,useEffect} from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
const SmsApi = () => {
  const [url, setUrl] = useState('');
  const [mobileKey, setMobileKey] = useState('');
  const [messageKey, setMessageKey] = useState('');
const [isSidebarOpen, setSidebarOpen] = useState(true);
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
  const handleUpdate = () => {
    // Handle the update logic here
    console.log("Updated API Configurations:", { url, mobileKey, messageKey });
  };

  return (
<div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
                
              {/* Sidebar component with open state */}
              <Sidebar isSidebarOpen={isSidebarOpen} />
                
                 {/* Content */}
         <div className={`flex-grow  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
      <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow sm:flex-row">
        <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
          <h1 className="text-lg font-semibold truncate sm:text-xl">SMS/WhatsApp API</h1>
          <span className="text-xs text-gray-600 sm:text-sm">Add/Update SMS API</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
          <a href="#" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
          </a>
          <BiChevronRight className="mx-1  sm:mx-2" />
          <a href="#" className="text-gray-700 no-underline hover:text-cyan-600">SMS/WhatsApp API</a>
        </nav>
      </header>

      {/* Instructions */}
      <div className="p-4 mb-6 bg-blue-100 border-l-4 border-blue-500">
        <h2 className="font-semibold">HTTP/URL SMS API</h2>
        <p>
          Example :
          <br />
          <code className="break-all">{`https://www.example.com/api/mt/SendSMS?APIKey=QWERTYUIOP123456&senderid=ABCDEFG&channel=2&DCS=0&flashsms=0&mobiles=91989xxxxxxx&message=test message&route=1`}</code>
        </p>
        <p className="mt-2">Note: You need to verify the message key & mobile number key from your API, each SMS service provider may have different keys.</p>
        <h3 className="mt-4 font-semibold">Example:</h3>
        <ol className="ml-6 list-decimal">
          <li>URL: <strong>https://www.example.com/api/mt/SendSMS</strong> (NOTE: Don't add ? in the input box)</li>
          <li>Mobile Key: <strong>mobiles</strong></li>
          <li>Message Key: <strong>message</strong></li>
          <li>APIKey: <strong>QWERTYUIOP123456</strong></li>
          <li>senderid: <strong>ABCDEFG</strong></li>
          <li>channel: <strong>2</strong></li>
          <li>DCS: <strong>0</strong></li>
          <li>flashsms: <strong>0</strong></li>
          <li>route: <strong>1</strong></li>
        </ol>
        <p className="mt-2">This is just an example, each SMS service provider may have different attributes, based on that you need to arrange it.</p>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-lg font-semibold">Key Configurations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="w-1/3">URL*</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-2/3 p-2 border border-gray-300 rounded"
              placeholder="http://example.com/sendmessage"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="w-1/3">Mobile Key*</label>
            <input
              type="text"
              value={mobileKey}
              onChange={(e) => setMobileKey(e.target.value)}
              className="w-2/3 p-2 border border-gray-300 rounded"
              placeholder="mobiles"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="w-1/3">Message Key*</label>
            <input
              type="text"
              value={messageKey}
              onChange={(e) => setMessageKey(e.target.value)}
              className="w-2/3 p-2 border border-gray-300 rounded"
              placeholder="message"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={handleUpdate} className="px-12 py-2 mr-2 text-white bg-green-500">Update</button>
          <button className="px-12 py-2 text-white bg-orange-500 ">Close</button>
        </div>
      </div>
    </div>
  </div>
  </div>
  );
};

export default SmsApi;
