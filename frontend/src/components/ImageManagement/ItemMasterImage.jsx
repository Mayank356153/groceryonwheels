import { useState } from 'react';
import axios from "axios"
const ItemMasterImage = ({ item, onClose }) => {
  const [selectedImageId, setSelectedImageId] = useState(item.masterImageId || null);
  const [images, setImages] = useState(item.itemImages || []);
  const FILES_BASE = "/vps/uploads/qr/items"
  console.log("item")
  console.log(item)
  const handleSetMasterImage =async (image) => {
    setSelectedImageId(image);
     const tokenHeader =  () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });
    try{
        const res = await axios.put(
        "api/items/assign/master_image",{
                  id:item._id,
                  image:image
        },
        tokenHeader()
      );
      console.log(res)
      alert("Master image selected")
      onClose();
    }
    catch(error){
      console.log("ERro in assigning master image",error)
    }
    
    
  };

  const handleReorderImages = (startIndex, endIndex) => {
    const result = Array.from(images);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setImages(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-5xl p-4 bg-white rounded-lg shadow-lg">
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

       <h3>Item Master Image</h3>
{item.masterImage && item.masterImage !== "" ? (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    <img
      // src={`${item.masterImage}`}
      src={`${FILES_BASE}/${item.masterImage}`}
      alt={`${item.itemName}`}
      className="object-cover w-full h-32"
    />
  </div>
) : (
  <div className="py-8 text-center text-gray-500">
    No Master Image is selected
  </div>
)}

        <h3 className="mb-4 text-lg font-semibold">Item Images</h3>

        {images.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No images available for this item
          </div>
        ) : 
        (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image, index) => 
            {
              console.log("image")
              console.log(image)
              // const img = it.itemImages?.[0]
              //         ? `${FILES_BASE}/${image}`
              //         : null;
            
            return(
              <div 
                key={image._id} 
                className={`relative border-2 rounded-lg overflow-hidden ${selectedImageId === image._id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const startIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handleReorderImages(startIndex, index);
                }}
              >
                <img 
                //   src={image.url} 
                  src={`${FILES_BASE}/${image}`}
                  alt={`Item ${item.itemName} - Image ${index + 1}`}
                  className="object-cover w-full h-32"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-1 text-xs text-white truncate bg-black bg-opacity-50">
                  {image.name || `Image ${index + 1}`}
                </div>
                
                <button
                  onClick={() => handleSetMasterImage(image)}
                  className={`absolute top-1 right-1 p-1 rounded-full ${selectedImageId === image._id ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  title={selectedImageId === image._id ? 'Master image' : 'Set as master'}
                >
                  {selectedImageId === image._id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="absolute px-1 text-xs text-white bg-black rounded top-1 left-1 bg-opacity-70">
                  {index + 1}
                </div>
              </div>
            )})}
          </div>
        )}

        {selectedImageId && (
          <div className="mt-4 text-sm text-gray-600">
            Master image selected: {images.find(img => img._id === selectedImageId)?.name || 'No name'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMasterImage;
