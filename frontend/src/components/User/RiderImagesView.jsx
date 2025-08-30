// import React from 'react';

// const RiderImagesView = ({ data, setView }) => {
//     console.log(data)
//   const images = [
//     { label: 'Profile Image', src: data.ProfileImage },
//     { label: 'Aadhar Card', src: data.AddharCardImage },
//     { label: 'PAN Card', src: data.PanCardImage },
//     { label: 'Driving License', src: data.DrivingLicenseImage }
//   ];
  

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         backgroundColor: 'rgba(0, 0, 0, 0.7)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 1000,
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: '#fff',
//           padding: '30px',
//           borderRadius: '12px',
//           maxHeight: '80%',
//           width: '80%',
//           maxWidth: '800px',
//           overflowY: 'auto',
//           boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
//           position: 'relative',
//         }}
//       >
//         {/* Close Button */}
//         <button
//           onClick={() => setView(false)}
//           style={{
//             position: 'absolute',
//             top: '15px',
//             right: '20px',
//             background: 'none',
//             border: 'none',
//             fontSize: '26px',
//             fontWeight: 'bold',
//             color: '#444',
//             cursor: 'pointer',
//           }}
//           title="Close"
//         >
//           ✖
//         </button>

//         <h2
//           style={{
//             textAlign: 'center',
//             marginBottom: '20px',
//             color: '#333',
//             textTransform: 'capitalize',
//           }}
//         >
//           Rider Documents Preview
//         </h2>

//         <div
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
//             gap: '20px',
//             justifyItems: 'center',
//           }}
//         >
//           {images.map((img, index) =>
//             img.src ? (
//               <div
//                 key={index}
//                 style={{
//                   position: 'relative',
//                   borderRadius: '10px',
//                   overflow: 'hidden',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
//                   width: '100%',
//                 }}
//               >
//                 <p
//                   style={{
//                     textAlign: 'center',
//                     fontWeight: 'bold',
//                     marginBottom: '8px',
//                     color: '#444',
//                   }}
//                 >
//                   {img.label}
//                 </p>
//                 {
//                     img.src.map(link =>(
//                            <img
//                   src={`uploads/${link}`}
//                   alt={img.label}
//                   style={{
//                     width: '100%',
//                     height: 'auto',
//                     maxHeight: '500px',
//                     objectFit: 'contain',
//                     display: 'block',
//                   }}
//                 />
//                     ))
//                 }
              
//               </div>
//             ) : null
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RiderImagesView;
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RiderImagesView = ({ data, setView }) => {
  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setView(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setView]);

  const images = [
    { label: 'Profile Image', src: data.ProfileImage },
    { label: 'Aadhar Card', src: data.AddharCardImage },
    { label: 'PAN Card', src: data.PanCardImage },
    { label: 'Driving License', src: data.DrivingLicenseImage }
  ].filter(img => img.src); // Filter out images without src

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setView(false)}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '16px',
            maxHeight: '90vh',
            width: '90%',
            maxWidth: '1200px',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setView(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#666',
              cursor: 'pointer',
              transition: 'color 0.2s',
              padding: '0.5rem',
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#333'}
            onMouseOut={(e) => e.currentTarget.style.color = '#666'}
            title="Close"
            aria-label="Close modal"
          >
            ✖
          </button>

          <h2
            style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
              color: '#2d3748',
              fontSize: '1.8rem',
              fontWeight: '600',
            }}
          >
            Rider Documents
          </h2>

          {images.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#718096',
              fontSize: '1.1rem'
            }}>
              No documents available for preview
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                justifyItems: 'center',
              }}
            >
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      margin: 0,
                      color: '#334155',
                      fontSize: '1.1rem'
                    }}>
                      {img.label}
                    </p>
                  </div>
                  <div style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {img.src.map((link, linkIndex) => (
                      <div key={linkIndex} style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                      }}>
                        <img
                          src={`/vps/uploads/riders/${link}`}
                          alt={`${img.label} ${linkIndex + 1}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '0.3rem',
                          textAlign: 'center',
                          fontSize: '0.8rem'
                        }}>
                          {link}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RiderImagesView;