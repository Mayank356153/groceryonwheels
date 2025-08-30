import React, { useEffect } from 'react';

const PreviewGallery = ({ setView, previewUrls,setFormData,formData,setPreviewUrls }) => {

  // Function to handle removing an image
  const handleRemoveImage = (Index) => {
    // Remove image from previewUrls
    
    const updateddata=formData.media.filter((_,index)=>index!==Index)
    setFormData((prev) => ({
      ...prev,
      media: updateddata,
    }));
    const updateurl=previewUrls.filter((_,index)=>index!==Index)
    setPreviewUrls(updateurl)
  
  };




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
                {file.path.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                  <video
                    controls
                    src={file.url}  // Use the video path
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    alt={`Video Preview ${mediaIndex + 1}`}
                  />
                ) : file.path.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) ? (
                  <img
                    src={file.url}  // Use the image path
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

                <button
                onClick={()=>handleRemoveImage(mediaIndex)}  // Remove media from previewUrls
                   // Remove media from previewUrls
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
                  title="Remove Media"
                >
                  &times;
                </button>
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

export default PreviewGallery;
