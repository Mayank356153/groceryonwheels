const AuditUser=require("../models/AuditPerson.model")
const Audit=require("../models/AuditModel")
const Warehouse=require("../models/warehouseModel")
const Store=require("../models/storeModel")
const bcryptjs=require("bcryptjs")
const jwt =require("jsonwebtoken")
const Items=require("../models/itemModel")
const mongoose=require("mongoose")
 const { buildStockMaps } = require("../helpers/stockMaps");
 const { updateInventory } = require('../helpers/inventory');
 const Category   = require('../models/categoryModel');
 const SubCategory= require('../models/subCategoryModel');
 const SubSubCat  = require('../models/subSubCategoryModel'); 
// const Warehouse=require("../models/warehouseModel")
//auditor login

exports.items=async(req,res)=>{
  try {
       const items = await Items.find();
       res.status(200).json({
           message: "Items fetched successfully",
           data: items
       });
  } catch (error) {
       console.error("🚨 Fetch Items Error:", error);
       res.status(500).json({ message: "Server error", error: error.message });
  }
}




exports.auditLogin=async(req,res)=>{
    try {
    console.log("🔹 Received Request Body:", req.body);
    
    const{username,password}=req.body
     console.log("🔹 Login Attempt - Username:", username);
    console.log("🔹 Login Attempt - Password:", password ? "Received" : "❌ MISSING!");

  if (!username || !password) {
      return res.status(400).json({ message: "❌ Email and Password are required" });
    }

    const findUser=await AuditUser.findOne({username:username})

    console.log(findUser)
    if (!findUser) {
      console.log("❌ User Not Found in DB");
      return res.status(400).json({ message: "User not found" });
    }

    if (!findUser.password) {
      console.log("❌ User Password is MISSING in DB");
      return res.status(500).json({ message: "User password is missing in the database" });
    }
    console.log(findUser.password)
    const isMatch=await bcryptjs.compare(password,findUser.password)

        console.log("🔹 Password Match Result:", isMatch);
      if (!isMatch) {
      console.log("❌ Password Incorrect");
      return res.status(400).json({ message: "Invalid credentials" });
    }

        console.log("✅ Password Matched. Generating Token...");
    const token=jwt.sign(
      {id:findUser._id},
      process.env.JWT_SECRET,
      {expiresIn:"7D"}
    );
        console.log("✅ Token Generated:", token);
     res.status(200).json({
      message:"Login Successful",
      token,
      user:{
        id:findUser._id,
        username:findUser.username,
        role:"auditor",
        auditId:findUser.auditId
      }
     })
  } catch (error) {
       console.error("🚨 Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
    }
}

const insertItems=async(warehouseId)=>{
   const stockMaps=await buildStockMaps(warehouseId?new mongoose.Types.ObjectId(warehouseId):null)
   const ItemsExist=await Items.find();
    const newitems=[];
    const g = (map, k) => map[k] || 0;
    for(i of ItemsExist){
       const opening=i.warehouse._id.toString() === warehouseId.toString() ? i.openingStock || 0 : 0;
       const k=i._id.toString();
       const totals={
         totalAdjustment   : g(stockMaps.adjMap,   k),
          totalIn           : g(stockMaps.inMap,    k),
          totalOut          : g(stockMaps.outMap,   k),
          totalPurchased    : g(stockMaps.purMap,   k),
          totalReturned     : g(stockMaps.rtMap,    k),
          totalSold         : g(stockMaps.posMap,   k),
          totalSalesSold    : g(stockMaps.saleMap,  k),
          totalReturnedSold : g(stockMaps.srtMap,   k) 
       }
      //  console.log(totals)
       const currentStock= opening
          + totals.totalPurchased   - totals.totalReturned
          + totals.totalAdjustment  + totals.totalIn
          - totals.totalOut         - totals.totalSold
          - totals.totalSalesSold   + totals.totalReturnedSold;
         if(currentStock<=0) continue;
          newitems.push({
            itemId:i._id,
            itemName:i.itemName,
            scannedQty:0,
            expectedQty:currentStock,
          })
    }
    
      return newitems;
}



//start audit
exports.createAudit=async(req,res)=>{
    try {
    const { storeId, warehouseId, users,partial } = req.body;
    console.log("Request Body:", req.body);
    if(!storeId && !warehouseId){
      return res.status(401).json({
        message:"either store or warehouse id is required"
      })
    }
    

    
    let storeExist = null;
if(storeId){
           storeExist = await Store.findById(storeId) || null ;
}

let warehouseExist = null;

 if(warehouseId){
   warehouseExist = await Warehouse.findById(warehouseId) || null ;
 }
    
    if (!storeExist && storeId) {
      return res.status(404).json({ 
        success: false,
        message: 'Store not found' 
      });
    }

    if (!warehouseExist && warehouseId) {
      return res.status(404).json({ 
        success: false,
        message: 'Warehouse not found' 
      });
    }
  // Process each user
   

   const it=await  insertItems(warehouseId);

   

    const auditSaved=new Audit ({
      createdBy:req.user.id,
        storeId:storeId || null,
        warehouseId:warehouseId || null,
        partial,
        items:it || [],
    })
    const audit_res=await auditSaved.save();

    if(!audit_res){
      return res.status(500).json({
        success: false,
        message: 'Failed to create audit',
      });
    }
      const createdUsers = [];
    const errors = [];

     for(const user of users){
      try{
        const existingUser = await AuditUser.findOne({ username: user.username });
        if (existingUser) {
          errors.push({
            username: user.username,
            error: 'Username already exists'
          });
          continue;
        }
        const hashedPassword = await bcryptjs.hash(user.password, 10);

        const person = new AuditUser({
          username: user.username,
          password: hashedPassword,
          employeeId: user.employeeId || "",
          auditId: audit_res._id // Associate with the created audit
        });
        console.log(person)
        const u= await person.save();
        createdUsers.push(person)
      }
      catch(error){
               console.log("Error in creating user for audit", error);
      }
    }
  
    res.status(201).json({
      message: "Audit started successfully",
      data:audit_res,
      users: createdUsers,
    });

  } catch (error) {
    console.error('Error in bulk user creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:error.message
    });
  } 
}





exports.putBucket = async (req, res) => {
  const { auditId, items } = req.body;

  if (!auditId || !items) {
    return res.status(400).json({
      success: false,
      message: "auditId and buckets array are required",
    });
  }

  try {
    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Audit not found" });
    }
    
       const g=(k)=> items[k] || 0
       const newItems=[]
       for (const item of audit.items){
          newItems.push({
              itemId:item.itemId,
            itemName:item.itemName,
            scannedQty:g(item.itemId),
            expectedQty:item.expectedQty,
          })
       }
       await Audit.findByIdAndUpdate(auditId,{
        items:newItems
       })
       return res.status(201).json(newItems)
  } catch (error) {
    console.error("Error submitting bucket:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const partialStockMaps=async(items,warehouseId)=>{
  const ItemsExist=await Items.find();
  const stockMaps=await buildStockMaps(new mongoose.Types.ObjectId(warehouseId));
  console.log(stockMaps.purMap)
 const g = (map, k) => (map && map[k] ? map[k] : 0);
               const newitems=[]
              for(const i of items){
                            const k=i.itemId.toString();
                            const opening = ItemsExist.find(it => it._id.toString() === k && it.warehouse._id.toString() === warehouseId.toString())?.openingStock || 0;
                            const totals={
                                totalAdjustment   : g(stockMaps.adjMap,   k),
          totalIn           : g(stockMaps.inMap,    k),
          totalOut          : g(stockMaps.outMap,   k),
          totalPurchased    : g(stockMaps.purMap,   k),
          totalReturned     : g(stockMaps.rtMap,    k),
          totalSold         : g(stockMaps.posMap,   k),
          totalSalesSold    : g(stockMaps.saleMap,  k),
          totalReturnedSold : g(stockMaps.srtMap,   k) 
                            }
                            const currentStock= opening
          + totals.totalPurchased   - totals.totalReturned
          + totals.totalAdjustment  + totals.totalIn
          - totals.totalOut         - totals.totalSold
          - totals.totalSalesSold   + totals.totalReturnedSold;

          const diif=currentStock - i.expectedQty;
             newitems.push({
              itemName:i.itemName,
              itemId:i.itemId,
              scannedQty:i.scannedQty + diif,
              expectedQty:currentStock
             })
                            
               }
               return newitems;
              }

exports.calculateAuditDiscrepancy = async (req, res) => {
  try {
    const creatorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all audits created by this user
    const audits = await Audit.find({ createdBy: creatorId, open: true });

    if (!audits.length) {
      return res.status(404).json({
        success: false,
        message: "No audits found for this user"
      });
    }
    console.log("users")
    const auditsAll=[]
   for (const audit of audits){
    if(audit.partial==false){
      auditsAll.push(audit);
      continue;
    }
       audit.items=await partialStockMaps(audit.items,audit.warehouseId);
       auditsAll.push(audit)
   }
   
       
    res.status(200).json({
      success: true,
      message: "Discrepancy calculated for all audits",
      data: auditsAll,
    });

  } catch (error) {
    console.error("Error in calculating discrepancies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};








exports.allAudits=async(req,res)=>{
  const creatorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all audits created by this user
    const audits = await Audit.find({ createdBy: creatorId});
    const a=await buildStockMaps(new mongoose.Types.ObjectId(audits[0].warehouseId));
    console.log(audits)
    
    console.log("users ");
    for(const audit of audits){
      const users=await AuditUser.find({auditId:audit._id})
      console.log(users);
       audit["users"]=users;
    }
    console.log(audits)

    return res.status(200).json({
      message:"Audit fetched successfully",
       data:audits,
    })
}




exports.applyAuditUpdates = async (req, res) => {
  try {
    const { items, auditId} = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty items array" });
    }
    console.log()
    if(!auditId){
      return res.status(400).json({
        success:false,
        message:"Audit Id is required"
      })
    }
     
    const auditUpdate=await Audit.findByIdAndUpdate(auditId,{
      items
    })

    return res.status(201).json({
      success:true,
      message:"Quantity updated in audit"
    })
  } catch (error) {
    console.error("Error updating item quantities from audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update item quantities",
      error: error.message,
    });
  }
};


exports.endAudit=async(req,res)=>{
  const auditId=req.body.auditId
  try {
    console.log(auditId)
    const update= await Audit.findByIdAndUpdate(auditId,{
      open:false
    })
    return res.status(200).json({
      success:true,
      message:"Audit End successfully",
      data:update
    })
  } catch (error) {
    return res.status(400).json({
      message:"Internal server error",
      error:error.message
    })
  }
}

// exports.allAudits=async(req,res)=>{
//    const creatorId = new mongoose.Types.ObjectId(req.user.id);

//     // Step 1: Get all audits created by this user
//     const audits = await Audit.find({ createdBy: creatorId });

//     if(!audits){
//       return res.status(400).json({
//         message:"Unable to fetch audits"
//       })
//     }
//     return res.status(200).json({
//       message:"Audit fetched successfully",
//       data:audits
//     })

// }


exports.deleteAudit=async(req,res)=>{
  const id=req.params.id
  try {
        await Audit.findByIdAndDelete(id)
        return res.status(200).json({
          message:"Deleted successfully"
        })    
  } catch (error) {
    return res.status(500).json({
      message:"Internal server error",
     error:error.message
    })
  }
}