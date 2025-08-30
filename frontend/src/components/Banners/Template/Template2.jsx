
import React,{forwardRef} from "react";
const BannerTemplateTwo = React.forwardRef(({ item }, ref) => (
    <div className="w-64 bg-[#f9fafb] rounded-md shadow-md border p-3 relative text-center" ref={ref}>
         <h4 className="text-lg font-bold">Grocery on wheels</h4>
      <p className="text-sm text-gray-600">
        shop number 210-211 basement new rishi nagar hisar 125001
      </p>
    <div className="absolute top-0 right-0 px-2 py-1 text-xs text-white bg-red-500 rounded-bl-lg">SALE</div>
    <img 
          src={`/vps/uploads/qr/items/${item.masterImage}`}
    alt={item.itemName} className="object-contain w-24 h-24 mx-auto my-2" />
    <h3 className="text-base font-bold">{item.itemName}</h3>
    <p className="text-xs text-gray-600">{item.description}</p>
    <div className="mt-1">
      <span className="font-bold text-green-600">Rs. {item.salesPrice}/{item.unit?.unitName}</span>
      <span className="ml-2 text-sm text-gray-400 line-through">
        Rs. {item.discountType === "Percentage" ? (item.salesPrice + item.salesPrice * (item.discount / 100)) : (item.salesPrice + item.discount)}/{item.unit?.unitName}
      </span>
    </div>
  </div>
  
  ));
  

  export default BannerTemplateTwo;