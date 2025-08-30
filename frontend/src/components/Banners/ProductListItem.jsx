import React, { useEffect } from 'react';

const ImagePreview = ({ setView, previewUrls }) => {

 




  useEffect(()=>console.log(previewUrls),[previewUrls])
  // Function to handle removing a video
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
          onClick={() => setView(false)}  // Close the preview gallery
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


        {previewUrls.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '15px',
            }}
          >
            {previewUrls.map((file, mediaIndex) => (
              <div
                key={mediaIndex}
                style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {/* Check if the file is a video or an image based on its path */}
                {file.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                  <video
                    controls
                     controlsList="nodownload"
                    src={`uploads/${file}`}  // Use the video path
                    style={{
                      width: '100%',
                      height: '150px',
                      // objectFit: 'cover',
                      // display: 'block',
                    }}
                    
                  />
                ) : file.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) ? (
                  <img
                    src={`uploads/${file}`}  // Use the image path
                    alt={`Image Preview ${mediaIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <p style={{ color: '#666' }}>Unsupported media type</p>
                )}

               
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>
            No media selected
          </p>
        )}
     
         
      </div>
    </div>
  );
};

export default ImagePreview;
