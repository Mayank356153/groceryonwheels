const banner=require("../models/BannerProductModel")
const allitems=require("../models/itemModel")


//create new banner
exports.createBanner = async (req, res) => {
  try {
    const { bannerType,path } = req.body;
    let items = req.body.items;
    const files = req.files || [];

    if (!bannerType) {
      return res.status(400).json({ message: "bannerType not given" });
    }
    if (!path) {
      return res.status(400).json({ message: "path not given" });
    }
    // Handle items as string (from multipart/form-data)
    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ message: "items array is required and should not be empty" });
    }

    if (bannerType === "SingleProduct" && parsedItems.length > 1) {
      return res.status(400).json({ message: "Multiple items not allowed for SingleProduct banner" });
    }

    // Process each item
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
    
      // Normalize Object in case it's from FormData
      const normalizedItem = JSON.parse(JSON.stringify(item));
    
      const { item: itemId, price, discountType, discount } = normalizedItem;
    
      if (!itemId) {
        return res.status(400).json({ message: `Item id missing at index ${i}` });
      }
    
      const existItem = await allitems.findById(itemId);
      if (!existItem) {
        return res.status(404).json({ message: `No such item found with id ${itemId}` });
      }
    
      if (!price) {
        return res.status(400).json({ message: `Price missing for item at index ${i}` });
      }
    
      if (discountType === "Fixed" && price < discount) {
        return res.status(400).json({ message: "Discount can't be more than price" });
      }
    
      if (discountType === "Percentage" && discount > 100) {
        return res.status(400).json({ message: "Discount can't be more than 100%" });
      }
     console.log(files)
      // Filter files for this item
      const itemFiles = files.filter(f => f.fieldname.startsWith(`items[${i}][images]`));
      console.log("itemFiles", itemFiles);
      
      const uploadedFilenames = [];
      
      for (const file of itemFiles) {
        try {
          console.log("file", file);
          
          // Instead of uploading, we are storing the filename directly in the images array
          uploadedFilenames.push(file.filename); // Store just the filename here (relative to public/uploads)
        } catch (err) {
          return res.status(500).json({ message: `Failed to process image`, error: err.message });
        }
      }
    
      // Replace the images field with filenames
      normalizedItem.images = uploadedFilenames;
    
      // Update back to parsedItems
      parsedItems[i] = normalizedItem;
    }
    
    
 
    const newBanner = await banner.create({
      bannerType,
      path,
      items: parsedItems,
    });

    return res.status(201).json({
      message: "Banner created successfully",
      data:newBanner,  
    });
  } catch (err) {
    console.error("Error in createBanner:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

    

  





  //get all banners
  exports.getAllBanner = async (req, res) => {
    try {
      const Banner = await banner.find()
      .populate("items.item"," itemName unit description itemImage")
      .populate({
        path:"items.item",
        select:"itemName unit description itemImage",
        populate:{
          path:"unit" ,
          select:"unitName description"
        }
      })

      if (!Banner) {
        return res.status(404).json({
          message: "Banner not found",
        });
      }
  
      return res.status(200).json({
          data:Banner
      }
    );
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  } 




  //get banner by id
  exports.getBannerById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id)
      const existBanner = await banner.findById(id);
      if (!existBanner) {
        return res.status(404).json({
          message: "Banner not found",
        });
      }
  
      return res.status(200).json(existBanner);
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  } 



// update banner by id
exports.updateBannerById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
  
      const updateBanner = await banner.findByIdAndUpdate(id, req.body, { new: true });
  
      if (!updateBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
  
      return res.status(200).json({
        message: "Update successful",
        response: updateBanner
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  

  
  //delete banner by id
  exports.deleteBannerById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
  
      const deletedBanner = await banner.findByIdAndDelete(id);
  
      if (!deletedBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
  
      return res.status(200).json({
        message: "deleted successful"
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
