
import React from "react";
const BannerTemplateOne = React.forwardRef(({ item }, ref) => (
    <div
      className="w-64 p-4 mx-auto text-center bg-white rounded-lg shadow"
      ref={ref}
      style={{ backgroundColor: "#fff" }}
    >
      <h4 className="text-lg font-bold">Grocery on wheels</h4>
      <p className="text-sm text-gray-600">
        shop number 210-211 basement new rishi nagar hisar 125001
      </p>
  
      <div className="flex justify-center mt-2 mb-3">
        <img
          src={`/vps/uploads/qr/items/${item.masterImage}`}
          alt={item.itemName}
          className="object-contain h-auto w-28"
          crossOrigin="anonymous"
        />
      </div>
  
      <p className="font-semibold text-gray-800">
        {item.itemName} – {item.description}
      </p>
  
      <div className="flex items-center justify-center gap-2 mt-2">
        <p className="font-bold text-blue-800">Rs.{item.salesPrice}/{item.unit?.unitName}</p>
        <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
          {item.discountType === "Fixed" && "Rs."}
          {item.discount}
          {item.discountType === "Percentage" && "%"} off
        </span>
      </div>
  
      <p className="text-sm text-gray-400 line-through">
        Rs. {item.discountType === "Percentage"
          ? (item.salesPrice + (item.salesPrice * item.discount / 100)).toFixed(2)
          : (item.salesPrice + item.discount).toFixed(2)}/{item.unit?.unitName}
      </p>
    </div>
  ));
  

  export default BannerTemplateOne;
