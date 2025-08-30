
import React from 'react';

const ImagePreview = ({ setView, data }) => {
 

  // Remove image from formData
 
  

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
  
        {data.length > 0 ? (
             data.map((it, itemIndex) => (
    <div key={itemIndex} style={{ marginBottom: '40px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: '#333',
        }}
      >
        {it.item.itemName || 'Unnamed Item'}
      </h3>

      {it.images && it.images.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            justifyItems: 'center',
          }}
        >
          {it.images.map((imgName,imageIndex) => (
            <div
              key={imageIndex}
              style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '150px',
              }}
            >
              <img
                src={`uploads/${imgName}`}
                alt={`Preview ${imageIndex + 1}`}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
             
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#666' }}>No images selected for this item</p>
      )}
    </div>
  ))
) : (
  <p style={{ textAlign: 'center', color: '#666' }}>No items available</p>
)}

      </div>
    </div>
  );
  
};

export default ImagePreview;
