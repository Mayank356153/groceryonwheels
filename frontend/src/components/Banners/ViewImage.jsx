
import React from 'react';

const ImagePreview = ({ formData, setFormData, id, setView }) => {
  const handleImagePreview = (imageFile) => {
    return URL.createObjectURL(imageFile);
  };

  // Remove image from formData
  const handleRemoveImage = (imageIndex) => {

    const updatedItems = formData.items.map((it, index) => {
      if (it.item === id) {
        
        // Remove the image at imageIndex
        const updatedImages = it.images.filter((_, idx) => idx !== imageIndex);
        return { ...it, images: updatedImages };
      }
      return it; // Don't change other items
    });
  
    // Update the state with the modified items array
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };
  

  // return (
  //   <div
  //     style={{
  //       position: 'fixed',
  //       top: 0,
  //       left: 0,
  //       width: '100%',
  //       height: '100%',
  //       backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent black background
  //       display: 'flex',
  //       justifyContent: 'center',
  //       alignItems: 'center',
  //       zIndex: 1000, // Ensure it appears on top of other content
  //     }}
  //   >
  //     <div
  //       style={{
  //         backgroundColor: 'rgba(255, 255, 255, 0.8)', // Light background for the image preview
  //         padding: '20px',
  //         borderRadius: '10px',
  //         maxHeight: '80%',
  //         overflowY: 'auto',
  //         width: '80%',
  //       }}
  //     >
  //       <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>
  //         Selected Images: {formData.items.filter(it => it.item === id).map(it => it.itemName).join(", ")}
  //       </h4>
        
  //       {/* Close Button */}
  //       <button
  //         onClick={() => setView(false)}
  //         style={{
  //           position: 'absolute',
  //           top: '10px',
  //           right: '10px',
  //           background: 'transparent',
  //           border: 'none',
  //           color: 'red',
  //           fontSize: '24px',
  //           cursor: 'pointer',
  //         }}
  //       >
  //         &#10005; {/* Cross icon for closing preview */}
  //       </button>

  //       {formData.items.filter(it => it.item === id).length > 0 ? (
  //         formData.items
  //           .filter(it => it.item === id)
  //           .map((item, itemIndex) => (
  //             item.images && item.images.length > 0 ? (
  //               item.images.map((file, imageIndex) => (
  //                 <div key={imageIndex} style={{ display: 'inline-block', margin: '10px', position: 'relative' }}>
  //                   <img
  //                     src={handleImagePreview(file)} 
  //                     alt={`Preview ${imageIndex + 1}`} 
  //                     style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
  //                   />
  //                   <button
  //                     onClick={() => handleRemoveImage(  imageIndex)}
  //                     style={{
  //                       position: 'absolute',
  //                       top: '5px',
  //                       right: '5px',
  //                       background: 'transparent',
  //                       border: 'none',
  //                       color: 'red',
  //                       fontSize: '16px',
  //                       cursor: 'pointer',
  //                     }}
  //                   >
  //                     &#x2716; {/* Cross icon (X) */}
  //                   </button>
  //                 </div>
  //               ))
  //             ) : (
  //               <p>No images selected for this item</p>
  //             )
  //           ))
  //       ) : (
  //         <p>No item found with the given ID</p>
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '12px',
          maxHeight: '80%',
          width: '80%',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setView(false)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#444',
            cursor: 'pointer',
          }}
          title="Close"
        >
          ✖
        </button>
  
        <h3 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>
          Selected Images: {formData.items.filter(it => it.item === id).map(it => it.itemName).join(", ") || 'None'}
        </h3>
  
        {formData.items.filter(it => it.item === id).length > 0 ? (
          formData.items
            .filter(it => it.item === id)
            .map((item, itemIndex) =>
              item.images && item.images.length > 0 ? (
                <div
                  key={itemIndex}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '15px',
                  }}
                >
                  {item.images.map((file, imageIndex) => (
                    <div
                      key={imageIndex}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <img
                        src={handleImagePreview(file)}
                        alt={`Preview ${imageIndex + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <button
                        onClick={() => handleRemoveImage( imageIndex)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(255, 0, 0, 0.8)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 'bold',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          lineHeight: '22px',
                          textAlign: 'center',
                        }}
                        title="Remove Image"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#666' }}>No images selected for this item</p>
              )
            )
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No item found with the given ID</p>
        )}
      </div>
    </div>
  );
  
};

export default ImagePreview;
