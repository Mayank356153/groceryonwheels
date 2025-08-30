
import { useState, useEffect } from 'react';
import axios from "axios";
import { IdentificationIcon } from '@heroicons/react/solid';

const CategoryMasterImage = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [masterImages, setMasterImages] = useState({});
  const[currentMasterImage,setCurrentMasterImage]=useState([])
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await axios.get(
          "/api/categories",
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        
        const dataArr = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : Array.isArray(categoriesResponse.data.data)
            ? categoriesResponse.data.data
            : [];
        
        setCategories(dataArr);

        // Fetch master images
        const masterResponse = await axios.get(
          '/api/items/getImageByCategory',
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (masterResponse.data.success) {
          setMasterImages(masterResponse.data.data);
          console.log(masterResponse.data.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleRegenerateMasterImage = async (id) => {
     try {
    setLoading(true);
    const res = await axios.get(
      `/api/items/category/getImageForCategory?categoryId=${id}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    console.log(res) 
    setCurrentMasterImage(res.data)
}

catch (err) {
    console.error("Failed to fetch merged images:", err);
  } finally {
    setLoading(false);
  }
  };



  const handleNextCategory = () => {
    setCurrentCategoryIndex(prev => (prev + 1) % categories.length);
  };


  const handlePrevCategory = () => {
    setCurrentCategoryIndex(prev => (prev - 1 + categories.length) % categories.length);
  };

  const currentCategory = categories[currentCategoryIndex];
  const currentCategoryId = currentCategory?._id || currentCategory?.id;

useEffect(() => {
  if (currentCategoryId && masterImages[currentCategoryId]) {
    setCurrentMasterImage(masterImages[currentCategoryId]);
  } else {
    setCurrentMasterImage([]);
  }
}, [currentCategoryId, masterImages]);

  const handleSubmit=async(image)=>{
      const tokenHeader =  () => ({
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
        try{
          console.log(image)
            const res = await axios.put(
            "/api/category/assign/master-image",{
                      id:currentCategoryId,
                      image:image
            },
            tokenHeader()
          );
          console.log(res)
          
          alert("Master image updated")
        }
        catch(error){
          console.log("ERro in assigning master image",error)
        }
  }

  if (loading && !categories.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p>Loading categories and master images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p className="text-red-500">{error}</p>
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
  <div className="relative w-11/12 max-w-5xl p-6 bg-white rounded-lg shadow-lg">
    {/* Close Button */}
    <button
      onClick={onClose}
      className="absolute p-1 text-gray-500 transition-colors duration-200 top-2 right-2 hover:text-gray-800 hover:bg-gray-100 rounded-full"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">
      Category Master Images
    </h2>

    {currentCategory && (
      <div className="text-center">
        <h3 className="mb-1 text-xl font-semibold text-gray-700">
          {currentCategory.name || `Category ${currentCategoryIndex + 1}`}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          ID: {currentCategoryId}
        </p>
      </div>
    )}

    <div className="p-4 mb-6 border border-gray-200 rounded-lg bg-gray-50">
      {currentMasterImage && currentMasterImage.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-full px-4 py-2 mb-2 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {currentMasterImage.map((img, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center transition-transform duration-200 hover:scale-105"
                >
                  <div className="relative group">
                    <img
                      src={img}
                      alt={`Master ${index + 1} for ${currentCategory?.name || currentCategoryId}`}
                      onClick={() => handleSubmit(img)}
                      className="object-contain w-48 h-48 rounded-lg shadow cursor-pointer md:w-64 md:h-64"
                    />
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 bg-black bg-opacity-0 rounded-lg opacity-0 group-hover:opacity-100 group-hover:bg-opacity-30">
                      <span className="px-3 py-1 text-sm font-medium text-white bg-black bg-opacity-50 rounded-full">
                        Select Image
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-600">Image {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">Scroll horizontally to view all images</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-gray-500">
            No master image available for this category
          </p>
        </div>
      )}
    </div>

    <div className="flex flex-col justify-between gap-4 mt-6 md:flex-row">
      <button
        onClick={handlePrevCategory}
        disabled={loading || categories.length <= 1}
        className="flex items-center justify-center px-4 py-2 text-white transition-colors duration-200 bg-gray-500 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed gap-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleRegenerateMasterImage(currentCategoryId)}
          disabled={loading || !currentCategory}
          className="flex items-center justify-center px-4 py-2 text-white transition-colors duration-200 bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed gap-x-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Master Image
            </>
          )}
        </button>
      </div>

      <button
        onClick={handleNextCategory}
        disabled={loading || categories.length <= 1}
        className="flex items-center justify-center px-4 py-2 text-white transition-colors duration-200 bg-gray-500 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed gap-x-2"
      >
        Next
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <div className="mt-4 text-sm text-center text-gray-500">
      Category <span className="font-medium">{currentCategoryIndex + 1}</span> of <span className="font-medium">{categories.length}</span>
    </div>
  </div>
</div>
  );
};

export default CategoryMasterImage;