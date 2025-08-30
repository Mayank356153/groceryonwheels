// // SystemTab.js
// import React from "react";

// const SystemTab = () => {
//   return (
//     <div className="p-4">
//       <h2 className="mb-4 text-xl font-semibold text-gray-700">
//         System Information
//       </h2>
//       <p className="text-gray-600">Here is some system-related information.</p>
//     </div>
//   );
// };

// export default SystemTab;
// // StoreTab.js
// import React from "react";

// const StoreTab = () => {
//   return (
//     <div className="p-4">
//       <h2 className="mb-4 text-xl font-semibold text-gray-700">
//         Store Information
//       </h2>
//       <p className="text-gray-600">Here is some store-related information.</p>
//     </div>
//   );
// };

// export default StoreTab;
import React, { useState } from "react";
import axios from "axios";

const SystemTab = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");

  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    const formData = {
      Timezone: username,
      Dateformat: firstName,
      TimeFormat: mobile,
      Currency: email,
      CurrencySymbolPlacement: email,
      Decimals: email,
      DecimalforQuantity: email,
      Language: email,
    };
    try {
      const response = await fetch(
        "admin/Store/add/systemzone",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create timezone");
      }
      const result = await response.json();
      console.log("Store created successfully", result);
      setUsername(" ");
      setFirstName(" ");
      setMobile("");
      setEmail("");
    } catch (Err) {
      console.log("Error found", Err);
    }
  };

  // const handleProfilePictureChange = (e) => {
  //   setProfilePicture(e.target.files[0]);
  // };

  return (
    <div className="mx-auto overflow-y-auto ">
      {/* <h1 className="mb-6 text-2xl font-bold text-start">Create User</h1> */}
      <form onSubmit={handleSubmit} className="">
        <div className="flex gap-20 ">
          {/* Left Column */}
          <div className="flex w-full gap-32 ">
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="username" className="block mb-2 font-medium">
                  TimeZone*
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block mb-2 font-medium">
                  Date Format
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* <div>
                <label htmlFor="lastName" className="block mb-2 font-medium">
                  Last Name*
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div> */}
              <div>
                <label htmlFor="mobile" className="block mb-2 font-medium">
                  Time Format
                </label>
                <input
                  id="mobile"
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Currency
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Currency Symbol Placement
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Decimals*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Decimals for Quantity*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="defaultWarehouse"
                  className="block mb-2 font-medium"
                >
                  Language*
                </label>
                <select
                  id="defaultWarehouse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="System Warehouse">System Warehouse</option>
                  {/* Add more warehouse options here */}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          {/* 
          <div className="space-y-4">
            <div className="">
              <label
                htmlFor="profilePicture"
                className="block mb-2 font-medium"
              >
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="profilePicture"
                  type="file"
                  onChange={handleProfilePictureChange}
                  className="block w-full sm:w-auto"
                />
                {profilePicture && (
                  <img
                    src={URL.createObjectURL(profilePicture)}
                    alt="Profile"
                    className="max-w-[150px] max-h-[150px] rounded-md border border-gray-300"
                  />
                )}
              </div>
            </div>
          </div> */}
          {/* Profile Picture */}

          {/* Buttons */}
        </div>
        <div className="flex justify-center col-span-1 gap-4 mt-10 sm:col-span-2">
          <button
            type="submit"
            className="px-6 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600"
          >
            Save
          </button>
          <button
            type="button"
            className="px-6 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemTab;
