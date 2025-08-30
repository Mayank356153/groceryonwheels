
import React,{forwardRef} from "react";
const BannerTemplateThree = React.forwardRef(({ item }, ref) => (
    <div className="relative w-64 p-4 text-center bg-white rounded-lg shadow-xl" ref={ref}>
         <h4 className="text-lg font-bold">Grocery on wheels</h4>
      <p className="text-sm text-gray-600">
        shop number 210-211 basement new rishi nagar hisar 125001
      </p>
    <img 
          src={`/vps/uploads/qr/items/${item.masterImage}`}
      alt={item.itemName} className="w-24 h-auto mx-auto mb-2" />
    <h3 className="text-base font-bold">{item.itemName}</h3>
    <p className="mb-1 text-xs text-gray-600">{item.description}</p>
    <div className="absolute px-2 py-1 text-xs text-white bg-green-600 rounded-full top-2 right-2">
      {item.discountType === "Fixed" ? `Rs.${item.discount}` : `${item.discount}%`} OFF
    </div>
    <p className="mt-2 font-bold text-blue-700">Rs. {item.salesPrice}/{item.unit?.unitName}</p>
    <p className="text-sm text-gray-400 line-through">
      Rs. {item.discountType === "Percentage" ? (item.salesPrice + item.salesPrice * (item.discount / 100)) : (item.salesPrice + item.discount)}/{item.unit?.unitName}
    </p>
  </div>
  
  
  ));
  

  export default BannerTemplateThree;