
import { useState, useEffect } from 'react';
import axios from "axios";
import { IdentificationIcon } from '@heroicons/react/solid';

const SubCategoryMasterImage = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [masterImages, setMasterImages] = useState({});
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
          "api/sub-subcategories",
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
          'api/items/getImageBySubSubCategory',
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
      `api/items/subsubcategory/assign-masterImage/?page=${page}`,{
        categoryId:id
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    const images = res.data || [];
setMasterImages((prev) => ({
  ...prev,
  [currentCategoryId]: [...images],
}));  } catch (err) {
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
  const currentMasterImage = currentCategoryId ? masterImages[currentCategoryId] : null;

   const handleSubmit=async(image)=>{
      const tokenHeader =  () => ({
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
        try{
            const res = await axios.put(
            "api/sub-subcategories/assign/master-image",{
                      id:currentCategoryId,
                      image:image[0]
            },
            tokenHeader()
          );
          console.log(res)
          alert("Master image selected")
        }
        catch(error){
          console.log("ERro in assigning master image",error)
        }
  }

  if (loading && !categories.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p>Loading subsubcategories and master images...</p>
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
          className="absolute p-1 text-gray-500 top-2 right-2 hover:text-gray-800"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-xl font-semibold text-center">
          subsubCategory Master Images
        </h2>

        {currentCategory && (
          <div className="text-center">
            <h3 className="mb-2 text-lg font-medium">
              {currentCategory.name || `Category ${currentCategoryIndex + 1}`}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              ID: {currentCategoryId}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-4 mb-6 border border-gray-200 rounded-lg">
          {currentMasterImage ? (
            <div className="flex flex-col items-center">
              <img  onClick={()=>handleSubmit(currentMasterImage)}
                src={`${currentMasterImage}`} 
                alt={`Master for ${currentCategory?.name || currentCategoryId}`}
                className="max-w-full mb-4 max-h-96"
              />
              <p className="text-sm text-gray-500">
                Last generated master image
              </p>
            </div>
          ) : (
            <p className="py-10 text-gray-500">
              No master image available for this category
            </p>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevCategory}
            disabled={loading || categories.length <= 1}
            className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex gap-4">
            <button
              onClick={()=>handleRegenerateMasterImage(currentCategoryId)}
              disabled={loading || !currentCategory}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Regenerate Master Image'}
            </button>
          </div>

          <button
            onClick={handleNextCategory}
            disabled={loading || categories.length <= 1}
            className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="mt-4 text-center text-gray-500">
          Category {currentCategoryIndex + 1} of {categories.length}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryMasterImage;