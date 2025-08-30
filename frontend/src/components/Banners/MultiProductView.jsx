
// // import html2canvas from "html2canvas";
// // import React,{useRef} from "react";

// // const MultiProductView = ({ items,setMultiView}) => {
// //     const ref=useRef();
// //     const downloadBanner = () => {
// //         html2canvas(ref.current, { useCORS: true, scale: 3, backgroundColor: null }).then((canvas) => {
// //           const link = document.createElement("a");
// //           link.download = `banner-template.png`;
// //           link.href = canvas.toDataURL("image/png");
// //           link.click();
// //         });
// //       };

// // return (
// //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
// //       <div className="relative w-full max-h-screen p-4 overflow-auto bg-gray-100 rounded-lg max-w-7xl">
// //         {/* Close Entire Component Button */}
// //         <button
// //           className="absolute z-10 text-xl font-bold text-gray-500 top-4 right-4 hover:text-red-600"
// //           onClick={() => setMultiView(false)}
// //         >
// //           ✕
// //         </button>
  
// //         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3" ref={ref}>
// //           {items.map((item, index) => (
            
// //             <div
// //             className="w-64 p-4 mx-auto text-center bg-white rounded-lg shadow"
// //             ref={ref}
// //             style={{ backgroundColor: "#fff" }}
// //           >
// //             <h4 className="text-lg font-bold">Grocery on wheels</h4>
// //             <p className="text-sm text-gray-600">
// //               shop number 210-211 basement new rishi nagar hisar 125001
// //             </p>
        
// //             <div className="flex justify-center mt-2 mb-3">
// //               <img
// //                 src="uploads/1746207961000.png"
// //                 alt={item.itemName}
// //                 className="object-contain h-auto w-28"
// //                 crossOrigin="anonymous"
// //               />
// //             </div>
        
// //             <p className="font-semibold text-gray-800">
// //               {item.itemName} – {item.description}
// //             </p>
        
// //             <div className="flex items-center justify-center gap-2 mt-2">
// //               <p className="font-bold text-blue-800">Rs.{item.salesPrice}/{item.unit?.unitName}</p>
// //               <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
// //                 {item.discountType === "Fixed" && "Rs."}
// //                 {item.discount}
// //                 {item.discountType === "Percentage" && "%"} off
// //               </span>
// //             </div>
        
// //             <p className="text-sm text-gray-400 line-through">
// //               Rs. {item.discountType === "Percentage"
// //                 ? (item.salesPrice + (item.salesPrice * item.discount / 100)).toFixed(2)
// //                 : (item.salesPrice + item.discount).toFixed(2)}/{item.unit?.unitName}
// //             </p>
// //           </div>
// //           ))}
// //         </div>
  
// //         <div className="flex justify-center mt-6">
// //           <button
// //             className="px-6 py-2 font-semibold text-white transition bg-blue-600 rounded hover:bg-blue-700"
// //             onClick={downloadBanner}
// //           >
// //             Download
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
  
  
// // };



// // export default MultiProductView;
// import html2canvas from "html2canvas";
// import React, { useRef } from "react";

// const MultiProductView = ({ items, setMultiView }) => {
//   const ref = useRef();

//   const downloadBanner = () => {
//     html2canvas(ref.current, {
//       useCORS: true,
//       scale: 3,
//       backgroundColor: null, // keeps background transparent
//     }).then((canvas) => {
//       const link = document.createElement("a");
//       link.download = `banner-template.png`;
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     });
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="relative w-full max-h-screen p-4 overflow-auto bg-gray-100 rounded-lg max-w-7xl">
//         {/* Close Entire Component Button */}
//         <button
//           className="absolute z-10 text-xl font-bold text-gray-500 top-4 right-4 hover:text-red-600"
//           onClick={() => setMultiView(false)}
//         >
//           ✕
//         </button>

//         {/* Capture this div for download */}
//         <div
//           className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
//           ref={ref}
//         >
//           {items.map((item, index) => (
//             <div
//               key={index}
//               className="w-64 p-4 mx-auto text-center bg-white rounded-lg shadow"
//               style={{ backgroundColor: "#fff" }}
//             >
              

//               <div className="flex justify-center mt-2 mb-3">
//                 <img
//                   src="uploads/1746207961000.png"
//                   alt={item.itemName}
//                   className="object-contain h-auto w-28"
//                   crossOrigin="anonymous"
//                 />
//               </div>

//               <p className="font-semibold text-gray-800">
//                 {item.itemName} – {item.description}
//               </p>

//               <div className="flex items-center justify-center gap-2 mt-2">
//                 <p className="font-bold text-blue-800">
//                   Rs.{item.salesPrice}/{item.unit?.unitName}
//                 </p>
//                 <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
//                   {item.discountType === "Fixed" && "Rs."}
//                   {item.discount}
//                   {item.discountType === "Percentage" && "%"} off
//                 </span>
//               </div>

//               <p className="text-sm text-gray-400 line-through">
//                 Rs.{" "}
//                 {item.discountType === "Percentage"
//                   ? (
//                       item.salesPrice +
//                       (item.salesPrice * item.discount) / 100
//                     ).toFixed(2)
//                   : (item.salesPrice + item.discount).toFixed(2)}
//                 /{item.unit?.unitName}
//               </p>
//             </div>
//           ))}
//         </div>

//         <div className="flex justify-center mt-6">
//           <button
//             className="px-6 py-2 font-semibold text-white transition bg-blue-600 rounded hover:bg-blue-700"
//             onClick={downloadBanner}
//           >
//             Download
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MultiProductView;

import React, { useRef } from "react";
import html2canvas from "html2canvas";

const MultiProductView = ({ items, setMultiView }) => {
  const ref = useRef();

  const downloadBanner = () => {
    html2canvas(ref.current, {
      useCORS: true,
      backgroundColor: "#ffffff", // white background for clean image
      scale: 3,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "products-banner.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-6xl p-6 bg-white rounded-lg">
        {/* Close Button */}
        <button
          className="absolute text-2xl text-gray-500 top-4 right-4 hover:text-red-600"
          onClick={() => setMultiView(false)}
        >
          ✕
        </button>

        <div ref={ref} className="p-4 bg-[#fdfef6] rounded-lg">
          <h2 className="mb-4 text-lg font-semibold">Products</h2>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {items.map((item, index) => (
              <div key={index} className="text-center">
                {/* Discount Badge */}
                {item.discountType === "Percentage" && (
                  <div className="inline-block px-2 py-1 mb-1 text-xs font-bold text-center text-white bg-green-600 rounded">
                    {item.discount}% OFF
                  </div>
                )}

                {/* Product Image */}
                <div className="relative inline-block">
                  <img
                    src={`/vps/uploads/qr/items/${item.masterImage}`}
                    alt={item.itemName}
                    className="object-contain mx-auto h-28"
                    crossOrigin="anonymous"
                  />
                  {/* Starburst Price Tag */}
                  <div className="absolute top-0 right-0 px-3 py-1 text-sm font-bold transform translate-x-2 -translate-y-2 bg-yellow-400 rounded-full shadow">
                    ₹{item.salesPrice.toFixed(1)}/{item.unit?.unitName}
                  </div>
                </div>

                {/* Product Name */}
                <p className="mt-2 text-sm font-medium text-gray-800">
                  {item.itemName}
                </p>

                {/* Struck-through MRP */}
                <p className="text-xs text-gray-400 line-through">
                  ₹
                  {item.discountType === "Percentage"
                    ? (
                        item.salesPrice +
                        (item.salesPrice * item.discount) / 100
                      ).toFixed(1)
                    : (item.salesPrice + item.discount).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={downloadBanner}
            className="px-6 py-2 font-semibold text-white transition bg-blue-600 rounded hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiProductView;
