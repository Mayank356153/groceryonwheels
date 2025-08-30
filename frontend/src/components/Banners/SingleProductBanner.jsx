// import React, { useRef, useState, useEffect } from "react";
// import html2canvas from "html2canvas";

// const SingleProductView = ({item,setView}) => {
//   const bannerRef = useRef();
//   const [imageLoaded, setImageLoaded] = useState(false);

//   const handleImageLoad = () => {
//     setImageLoaded(true);
//   };

//   const downloadBanner = () => {
//     // Log to ensure image is in the DOM
//     console.log(bannerRef.current);

//     html2canvas(bannerRef.current, {
//       scale: 3,
//       useCORS: true, // Ensure CORS is enabled
//     }).then((canvas) => {
//       const link = document.createElement("a");
//       link.download = "product-discount-banner.png";
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     });
//   };



//   // return (
//   //   <div className="absolute top-0 flex justify-center w-full h-full bg-gray-800 bg-opacity-50 item0s-center">
//   //     <div
//   //       className="w-64 p-4 mx-auto my-24 text-center bg-white rounded-lg shadow "
//   //       ref={bannerRef}
//   //     >
//   //       <h4 className="text-lg font-bold">Grocery on wheels</h4>
//   //       <p className="text-sm text-gray-600">
//   //         shop number 210-211 basement new rishi nagar hisar 125001
//   //       </p>

//   //       <div className="flex justify-center mt-2 mb-3">
//   //         <img
//   //           src="uploads/1746207961000.png"
//   //           alt="Vim Dishwash"
//   //           className="object-contain h-auto w-28"
//   //           onLoad={handleImageLoad}
//   //         />
//   //       </div>

//   //       <p className="font-semibold text-gray-800">
//   //         Vim Dishwash Liquid Gel – Lemon 1.8 L Can
//   //       </p>

//   //       <div className="flex items-center justify-center gap-2 mt-2">
//   //         <p className="font-bold text-blue-800">Rs. 400.0/Piece</p>
//   //         <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
//   //           10% off
//   //         </span>
//   //       </div>
//   //       <p className="text-sm text-gray-400 line-through">Rs. 445.0/Piece</p>
//   //     </div>
//   //     <button
//   //       className="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
//   //       type="button"
//   //       onClick={downloadBanner}
//   //     >
//   //       Download
//   //     </button>
//   //   </div>
//   // );
  
  
  
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
//           width: '360px',
//           overflowY: 'auto',
//           boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
//           position: 'relative',
//           textAlign: 'center',
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

//         {/* Banner Preview */}
//         <div
//           className="w-64 p-4 mx-auto text-center bg-transparent rounded-lg shadow"
//           ref={bannerRef}
//         >
//           <h4 className="text-lg font-bold">Grocery on wheels</h4>
//           <p className="text-sm text-gray-600">
//             shop number 210-211 basement new rishi nagar hisar 125001
//           </p>

//           <div className="flex justify-center mt-2 mb-3">
//             <img
//               src="uploads/1746207961000.png"
//               alt="Vim Dishwash"
//               className="object-contain h-auto w-28"
//             />
//           </div>

//           <p className="font-semibold text-gray-800">
//             {item.itemName} – {item.description}
//           </p>

//           <div className="flex items-center justify-center gap-2 mt-2">
//             <p className="font-bold text-blue-800">Rs{item.salesPrice}/{item.unit?.unitName}</p>
//             <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
//                {item.discountType==="Fixed" && "Rs."}{item.discount}{item.discountType==="Percentage" && "%"} off
//             </span>
//           </div>
//           <p className="text-sm text-gray-400 line-through">Rs. {item.discountType==="Percentage"?(item.salesPrice+(item.salesPrice *(item.discount /100 ))):(item.salesPrice+item.discount)}/Piece</p>
//         </div>

//         {/* Download Button */}
//         <button
//           onClick={downloadBanner}
//           style={{
//             marginTop: '20px',
//             padding: '10px 20px',
//             backgroundColor: '#3b82f6',
//             color: '#fff',
//             borderRadius: '8px',
//             border: 'none',
//             fontWeight: 'bold',
//             cursor: 'pointer',
//           }}
//         >
//           Download Banner
//         </button>
//       </div>
//     </div>
//   );

  
// };


// export default SingleProductView;
import html2canvas from "html2canvas";
import React,{useRef} from "react";
import BannerTemplateOne from "./Template/Template1";
import BannerTemplateTwo from "./Template/Template2";
import BannerTemplateThree from "./Template/Template3";
const SingleProductView = ({ item, setView }) => {
  const bannerRefs = [useRef(), useRef(), useRef()]; // Add more if needed
  
  const downloadBanner = (ref, index) => {
    html2canvas(ref.current, { useCORS: true, scale: 3, backgroundColor: null }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `banner-template-${index + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '30px',
        borderRadius: '16px',
        maxHeight: '90%',
        width: '90%',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        textAlign: 'center'
      }}>
        {/* Close Button */}
        <button onClick={() => setView(false)} style={{
          position: 'absolute',
          top: '15px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '26px',
          fontWeight: 'bold',
          color: '#555',
          cursor: 'pointer'
        }}>
          ✖
        </button>
  
        {/* Title */}
        <h3 style={{
          marginBottom: '25px',
          color: '#111827',
          fontSize: '20px',
          fontWeight: '600',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px'
        }}>
          Banner Templates Preview
        </h3>
  
        {/* Horizontal Template Preview */}
        <div style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '10px',
          justifyContent: 'flex-start'
        }}>
          {[BannerTemplateOne, BannerTemplateTwo, BannerTemplateThree].map((Template, idx) => (
            <div
              key={idx}
              style={{
                minWidth: '280px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                padding: '16px',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <Template ref={bannerRefs[idx]} item={item} />
              <button
                onClick={() => downloadBanner(bannerRefs[idx], idx)}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(59,130,246,0.3)'
                }}
              >
                Download Template {idx + 1}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
};

export default SingleProductView