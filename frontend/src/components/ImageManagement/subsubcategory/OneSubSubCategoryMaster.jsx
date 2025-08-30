import { useState, useEffect } from 'react';
import axios from "axios";

const OneSubSubCategoryMaster = ({ onClose, subcategory }) => {
  const [masterImages, setMasterImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);


    useEffect(() => {
         handleRegenerateMasterImage()
         console.log("SubSubCategory:", subcategory)
     }, []);


  const handleRegenerateMasterImage = async () => {
    try {    
      setLoading(true);
      const res = await axios.get(
 `/api/items/subsubcategory/getImageForsubSubCategory?subSubCategoryId=${subcategory._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log(res)
      setMasterImages(res.data);
    } catch (err) {
      console.log(err);
      console.error("Failed to regenerate master images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsMaster = async (image) => {
    try {
      const res = await axios.put(
        `api/subsubcategory/assign-masterImage`,
        {
          id:subcategory._id,
          image: image
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

       console.log(res)
      if (res.data.success) {
              alert("Master image updated successfully!");
      }
    } catch (err) {
      console.error("Failed to set master image:", err);
      alert(" set as master image.");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !subcategory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p className="text-red-500">{error || "Category not found."}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-4xl p-6 bg-white rounded-lg shadow-lg">
        <button
          onClick={onClose}
          className="absolute p-1 text-gray-500 top-2 right-2 hover:text-gray-800"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-xl font-semibold text-center">Master Images - {subcategory.name}</h2>
        <p className="mb-4 text-center text-gray-500">SubSubCategory ID: {subcategory._id}</p>

        {masterImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 md:grid-cols-3">
            {masterImages.map((img, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-2 border rounded shadow-sm">
                <img
                  src={`${img}`}
                  alt="master"
                  className="object-contain mb-2 max-h-64"
                />
                <button
                  onClick={() => handleSetAsMaster(img)}
                  className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Set as Master
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No master images available.</p>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={handleRegenerateMasterImage}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            {loading ? 'Generating...' : 'Regenerate Master Images'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneSubSubCategoryMaster;
