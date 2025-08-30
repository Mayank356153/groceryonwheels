const Item=require("../models/itemModel.js");
const MarketingItem = require("../models/marketingItemModel.js");
const Sale = require('../models/Sales.js');




// Create a new marketing item
exports.createMarketingItem = async (req, res) => {
  const { item, type } = req.body;
  try{
    // Check if the item exists
    const existingItem = await Item.findById(item);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    if(!type) {
        return res.status(400).json({ message: "Type is required" });
     }
    const MarketItemSave= new MarketingItem({
      item,
      type:type.toLowerCase(),
    });
    await MarketItemSave.save();
    return res.status(201).json({ message: "Marketing item created successfully", MarketItemSave });

  }
  catch (error) {
    console.error("Error creating marketing item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }  

}



exports.getAllMarketingItems = async (req, res) => {
  try {
    // 1. Fetch marketing items
    const marketingItems = await MarketingItem.find()
      .populate("item", "itemName sku salesPrice priceWithoutTax purchasePrice itemImage");

    // 2. Get all item IDs
    const itemIds = marketingItems.map((mi) => mi.item?._id).filter(Boolean);

    // 3. Aggregate totalSold for each item
    const salesData = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.item": { $in: itemIds },
        },
      },
      {
        $group: {
          _id: "$items.item",
          totalSold: { $sum: "$items.quantity" },
        },
      },
    ]);

    // 4. Map itemId to totalSold
    const totalSoldMap = new Map();
    salesData.forEach((entry) => {
      totalSoldMap.set(entry._id.toString(), entry.totalSold);
    });

    // 5. Append totalSold to each marketing item
    const enrichedItems = marketingItems.map((mi) => {
      const totalSold = totalSoldMap.get(mi.item?._id?.toString()) || 0;
      return {
        ...mi.toObject(),
        totalSold,
      };
    });

    // 6. Group by type
    const grouped = enrichedItems.reduce((acc, curr) => {
      const type = curr.type.toLowerCase();
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(curr);
      return acc;
    }, {});

    return res.status(200).json({
      message: "MarketingItems Retrieved successfully",
      data: grouped || [],
    });
  } catch (error) {
    console.error("Error fetching marketing items:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

  



//get marketing item by particular  type
exports.getMarketingItemByType = async (req, res) => {
  const { type } = req.params;
  try {
    const marketingItems = await MarketingItem.find({ type:type.toLowerCase() }).populate("item", "name sku salesPrice  priceWithoutTax  purchasePrice itemImage");
    return res.status(200).json({message:"MarketingItems Retrieved successfully" ,data:marketingItems}); 
} 
catch(error) {
    console.error("Error fetching marketing items:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


//delete marketing item by id
exports.deleteMarketingItem = async (req, res) => {
  const { id } = req.params;
  try {
    const marketingItem = await MarketingItem.findByIdAndDelete(id);
    if (!marketingItem) {
      return res.status(404).json({ message: "Marketing item not found" });
    }
    return res.status(200).json({ message: "Marketing item deleted successfully" });
  } catch (error) {
    console.error("Error deleting marketing item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




//update marketing item by id
exports.updateMarketingItem = async (req, res) => {
  const { id } = req.params;
  const { item, type } = req.body;
  try {
    const marketingItem = await MarketingItem.findByIdAndUpdate(
      id,
      { item, type },
      { new: true }
    ).populate("item", "name sku salesPrice  priceWithoutTax  purchasePrice itemImage"); 
    if (!marketingItem) {
      return res.status(404).json({ message: "Marketing item not found" });
    }
    return res.status(200).json({ message: "Marketing item updated successfully",data: marketingItem });
    }
    catch (error) {
        console.error("Error updating marketing item:", error);
        return res.status(500).json({ message: "Internal server error" });
        }
    }       


 // Function to automatically add trending items based on sales data   
exports.getTopTrendingItems = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    const trendingItems = await Sale.aggregate([
      { $unwind: "$items" },
      { 
        $group: { 
          _id: "$items.item",    // corrected from "items.itemId" to "items.item"
          totalSold: { $sum: "$items.quantity" } 
        } 
      },
      { 
        $lookup: { 
          from: "items", 
          localField: "_id", 
          foreignField: "_id", 
          as: "itemDetails" 
        } 
      },
      { $unwind: "$itemDetails" },
      { 
        $project: { 
          itemName: "$itemDetails.itemName", 
          totalSold: 1, 
          salesPrice: "$itemDetails.salesPrice",
          itemCode: "$itemDetails.itemCode",
          itemImage: "$itemDetails.itemImage"
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({ success: true, data: trendingItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//get marketing item by id
exports.getMarketingItemById = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(id)
    const marketingItem = await MarketingItem.findById(id).populate("item", "ItemName sku salesPrice  priceWithoutTax  purchasePrice itemImage"); 
    if (!marketingItem) {
      return res.status(404).json({ message: "Marketing item not found" });
    }
    return res.status(200).json({ message: "Marketing item retrieved successfully",data: marketingItem });
  } catch (error) {
    console.error("Error fetching marketing item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


