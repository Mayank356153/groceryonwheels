import React from 'react';

const DocumentView = ({ setView, show, formData, setFormData }) => {
  // Get the images array from formData based on the show prop
  const images = formData[show] ? formData[show] : [];

  // Function to remove image by index
  const removeImage = (index) => {
   
    // Create a new array without the removed image
    const updatedImages = images.filter((_, i) => i !== index);
    
    // Update formData
    setFormData(prev => ({
      ...prev,
      [show]: updatedImages.length > 0 ? updatedImages : []
    }));
  };

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
          maxWidth: '800px',
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

        <h2
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#333',
            textTransform: 'capitalize'
          }}
        >
          {show.replace(/([A-Z])/g, ' $1')} Preview
        </h2>

        {images.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px',
              justifyItems: 'center',
            }}
          >
            {images.map((imgSrc, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  width: '100%',
                }}
              >
               <img
  src={
    imgSrc instanceof File
      ? URL.createObjectURL(imgSrc)
      : `/vps/uploads/riders/${imgSrc}`
  }
  alt={`${show} preview ${index + 1}`}
  style={{
    width: '100%',
    height: 'auto',
    maxHeight: '500px',
    objectFit: 'contain',
    display: 'block',
  }}
/>

                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(255, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>
            No {show.replace(/([A-Z])/g, ' $1').toLowerCase()}  available
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentView;