const mongoose   = require('mongoose');
const path = require("path");
console.log("Path module loaded:", path, typeof path, path.resolve);
const fs = require("fs");
const Item       = require('../models/itemModel');
const Category   = require('../models/categoryModel');
const SubCategory= require('../models/subCategoryModel');
const SubSubCat  = require('../models/subSubCategoryModel');
const Brand      = require('../models/brandModel');
const Unit       = require('../models/unitModel');
const Tax        = require('../models/taxModel');
const Warehouse  = require('../models/warehouseModel');
const Inventory  = require('../models/inventoryModel');
const { updateInventory } = require('../helpers/inventory');
const StockAdjustment = require('../models/stockAdjustmentModel');
const StockTransfer   = require('../models/stockTransferModel');
const { fetchCurrentStockMap } = require('../services/inventoryService');
const Purchase        = require('../models/purchaseModel');
const PosOrder        = require('../models/PosOrder');
const Sales    = require('../models/Sales');
const SalesReturn = require('../models/SalesReturn');
const { buildStockMaps } = require("../helpers/stockMaps"); 
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const Fuse = require("fuse.js");
//const { pullFromS3 } = require('../utils/s3Pull');
//const BUCKET = process.env.AWS_BUCKET;
//const s3     = new S3Client({ region: process.env.AWS_REGION });



// randomize items
const shuffleArray = (arr) => {
  return arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};


// Lookup or create helper
async function lookupOrCreate(Model, lookup, data) {
  let doc = await Model.findOne(lookup);
  if (!doc) doc = await Model.create(data);
  return doc._id;
}

// helper to bump itemCode
function generateItemCode(lastCode) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(lastCode || '');
  const prefix = m ? m[1].toUpperCase() : 'IT';
  const nextNum = m ? parseInt(m[2],10) + 1 : 1;
  const width = m ? m[2].length : 6;
  return prefix + String(nextNum).padStart(width, '0');
}

exports.createItemBySQL = async (req, res) => {
  try {
    /* ── 1. grab fields (incl. isOnline) ─────────────────── */
    let {
      itemCode, itemName, brand, category, subCategory, subSubCategory,
      unit, itemGroup, sku, hsn, barcodes = [],
      priceWithoutTax, purchasePrice, salesPrice, profitMargin, mrp,
      alertQuantity, sellerPoints, description,
      discountType, discount, discountPolicy, requiredQuantity, freeQuantity,
      tax, expiryDate, warehouse, openingStock,
      variants,               // may be JSON string
      isOnline,itemImages                // ← NEW
    } = req.body;
   
    /* ── 2. resolve JSON-strings for refs ─────────────────── */
    ["brand","category","subCategory","subSubCategory","unit","tax","warehouse"]
      .forEach(f => {
        if (typeof req.body[f] === "string") {
          try { const o = JSON.parse(req.body[f]); if (o?._id) req.body[f] = o._id; }
          catch { /* ignore */ }
        }
      });
      console.log("formdata",req.body)
    /* ── 3. variants parsing (if Variant group) ───────────── */
    let parsedVariants = [];
    if (variants) {
      if (typeof variants === "string") {
        try { parsedVariants = JSON.parse(variants); }
        catch { parsedVariants = []; }
      } else if (Array.isArray(variants)) parsedVariants = variants;
    }
    if (itemGroup === "Variant" && parsedVariants.length === 0) {
      return res.status(400).json({ success:false, message:"Variant items must include variants" });
    }

    /* ── 4. itemCode autogen ─────────────────────────────── */
    if (!itemCode) {
      const last = await Item.findOne().sort({ createdAt:-1 }).select("itemCode").lean();
      itemCode = generateItemCode(last?.itemCode);
    }
    /* ── 5. build payload ────────────────────────────────── */
    const payload = {
      itemCode, itemName, brand, category, subCategory, subSubCategory,
      unit, itemGroup, alertQuantity, sellerPoints, description,
      discountType, discount, discountPolicy, requiredQuantity, freeQuantity,
      tax, expiryDate, warehouse, openingStock,
      itemImages
    };

    if (itemGroup === "Single") {
      Object.assign(payload, {
        sku, hsn, barcodes: Array.isArray(barcodes)?barcodes:[],
        priceWithoutTax, purchasePrice, salesPrice, profitMargin, mrp,
        variants:[]
      });
    } else {                                // Variant group
      Object.assign(payload, {
        sku:"", hsn:"", barcodes:[],
        priceWithoutTax:0, purchasePrice:0, salesPrice:0, profitMargin:0, mrp:0,
        variants: parsedVariants.map(v => ({
          variantId       : v.variantId || v._id,
          sku             : v.sku            || "",
          hsn             : v.hsn            || "",
          barcodes        : Array.isArray(v.barcodes) ? v.barcodes : [],
          priceWithoutTax : +v.priceWithoutTax || 0,
          purchasePrice   : +v.purchasePrice   || 0,
          salesPrice      : +v.salesPrice      || 0,
          mrp             : +v.mrp             || 0,
          profitMargin    : +v.profitMargin    || 0,
          openingStock    : +v.openingStock    || 0,
          discountPolicy  : v.discountPolicy   || "None",
          requiredQuantity: +v.requiredQuantity|| 0,
          freeQuantity    : +v.freeQuantity    || 0
        }))
      });
    }

    /* ── 6. visibility flag (default = true) ─────────────── */
    payload.isOnline =
      isOnline === undefined ? true
                              : (isOnline === true || isOnline === "true");

    /* ── 7. save & adjust opening stock ──────────────────── */
    const newItem = await Item.create(payload);
    await updateInventory(newItem.warehouse, newItem._id, +(newItem.openingStock||0));

    const populated = await Item.findById(newItem._id)
      .populate("warehouse","warehouseName location")
      .populate("category subCategory subSubCategory","name description")
      .populate("brand","brandName")
      .populate("unit","unitName")
      .populate("tax","taxName taxPercentage")
      .populate("variants.variantId","variantName")
      .lean();

    return res.status(201).json({ success:true, message:"Item created", data:populated });

  } catch (err) {
    console.error("createItem error:", err);
    return res.status(500).json({ success:false, message:err.message });
  }
};

//update item from purchase
exports.updateItemFromPurchase=async(req,res)=>{
  try {
    const{itemId,mrp,purchasePrice,discount,salesPrice}=req.body
    console.log("req",req.body)
    const exist= await Item.findById(new mongoose.Types.ObjectId(itemId))
    if(!exist) return res.status(404).json({ success:false, message:"Item not found" })

    // update item fields
    exist.mrp = mrp
    exist.purchasePrice = purchasePrice
     exist.salesPrice = salesPrice
    await exist.save()

    return res.status(200).json({ success:true, message:"Item updated successfully", data:exist })
  } catch (error) {
    console.log("Error in updating item from purchase",error)
    return res.status(501).json({ success:false, message:error.message })
  }
}

// CREATE Item
exports.createItem = async (req, res) => {
  try {
    const files = req.files || [];

    /* ── 1. grab fields (incl. isOnline) ─────────────────── */
    let {
      itemCode, itemName, brand, category, subCategory, subSubCategory,
      unit, itemGroup, sku, hsn, barcodes = [],
      priceWithoutTax, purchasePrice, salesPrice, profitMargin, mrp,
      alertQuantity, sellerPoints, description,
      discountType, discount, discountPolicy, requiredQuantity, freeQuantity,
      tax, expiryDate, warehouse, openingStock,
      variants,               // may be JSON string
      isOnline                // ← NEW
    } = req.body;

    /* ── 2. resolve JSON-strings for refs ─────────────────── */
    ["brand","category","subCategory","subSubCategory","unit","tax","warehouse"]
      .forEach(f => {
        if (typeof req.body[f] === "string") {
          try { const o = JSON.parse(req.body[f]); if (o?._id) req.body[f] = o._id; }
          catch { /* ignore */ }
        }
      });

    /* ── 3. variants parsing (if Variant group) ───────────── */
    let parsedVariants = [];
    if (variants) {
      if (typeof variants === "string") {
        try { parsedVariants = JSON.parse(variants); }
        catch { parsedVariants = []; }
      } else if (Array.isArray(variants)) parsedVariants = variants;
    }
    if (itemGroup === "Variant" && parsedVariants.length === 0) {
      return res.status(400).json({ success:false, message:"Variant items must include variants" });
    }

    /* ── 4. itemCode autogen ─────────────────────────────── */
    if (!itemCode) {
      const last = await Item.findOne().sort({ createdAt:-1 }).select("itemCode").lean();
      itemCode = generateItemCode(last?.itemCode);
    }

    /* ── 5. build payload ────────────────────────────────── */
    const payload = {
      itemCode, itemName, brand, category, subCategory, subSubCategory,
      unit, itemGroup, alertQuantity, sellerPoints, description,
      discountType, discount, discountPolicy, requiredQuantity, freeQuantity,
      tax, expiryDate, warehouse, openingStock,
      itemImages: files.map(f => f.filename)
    };

    if (itemGroup === "Single") {
      Object.assign(payload, {
        sku, hsn, barcodes: Array.isArray(barcodes)?barcodes:[],
        priceWithoutTax, purchasePrice, salesPrice, profitMargin, mrp,
        variants:[]
      });
    } else {                                // Variant group
      Object.assign(payload, {
        sku:"", hsn:"", barcodes:[],
        priceWithoutTax:0, purchasePrice:0, salesPrice:0, profitMargin:0, mrp:0,
        variants: parsedVariants.map(v => ({
          variantId       : v.variantId || v._id,
          sku             : v.sku            || "",
          hsn             : v.hsn            || "",
          barcodes        : Array.isArray(v.barcodes) ? v.barcodes : [],
          priceWithoutTax : +v.priceWithoutTax || 0,
          purchasePrice   : +v.purchasePrice   || 0,
          salesPrice      : +v.salesPrice      || 0,
          mrp             : +v.mrp             || 0,
          profitMargin    : +v.profitMargin    || 0,
          openingStock    : +v.openingStock    || 0,
          discountPolicy  : v.discountPolicy   || "None",
          requiredQuantity: +v.requiredQuantity|| 0,
          freeQuantity    : +v.freeQuantity    || 0
        }))
      });
    }

    /* ── 6. visibility flag (default = true) ─────────────── */
    payload.isOnline =
      isOnline === undefined ? true
                              : (isOnline === true || isOnline === "true");

    /* ── 7. save & adjust opening stock ──────────────────── */
    const newItem = await Item.create(payload);
    await updateInventory(newItem.warehouse, newItem._id, +(newItem.openingStock||0));

    const populated = await Item.findById(newItem._id)
      .populate("warehouse","warehouseName location")
      .populate("category subCategory subSubCategory","name description")
      .populate("brand","brandName")
      .populate("unit","unitName")
      .populate("tax","taxName taxPercentage")
      .populate("variants.variantId","variantName")
      .lean();

    return res.status(201).json({ success:true, message:"Item created", data:populated });

  } catch (err) {
    console.error("createItem error:", err);
    console.log("formdata", req.body);
    return res.status(500).json({ success:false, message:err.message });
  }
};


// GET all items
// GET all items (flattening Variant‐group into separate entries)
// controllers/itemController.js
// GET /api/items\

exports.updateSalesPrice=async(req,res)=>{
  const {itemId,salesPrice}=req.body;
  if(!itemId || salesPrice==0){
    return res.status(500).json({
      message:"Input is wrong",
      success:false
    })
  }
  const exist =await Item.findById(itemId);
  
  
  if(!exist){
    return res.status(404).json({
      message:"Item not found",
      success:false
    })
  }


  if(salesPrice<exist.mrp){
    exist.salesPrice=salesPrice
    await exist.save()
    return res.status(200).json({
      message:"Sales price updated successfully",
      success:true,
      data:exist
      })
    }
    await Item.findByIdAndUpdate(itemId,{salesPrice:salesPrice})
    return res.json({
      message:"Sales price updated successfully",
      success:true
    })
  }

exports.getAllItems = async (req, res) => {
  try {
    /* ── 1. Query params ─────────────────────────────────── */
    const { warehouse: wId, search = "", page = 1, limit, inStock } = req.query;

    const warehouseOid = wId ? new mongoose.Types.ObjectId(wId) : null;
    const pageNum      = Math.max(parseInt(page), 1);
   const limNum = limit === undefined ? Number.MAX_SAFE_INTEGER
                                    : Math.max(parseInt(limit), 1);

    /* ── 2. Build base Mongo query (no warehouse filter; we
            want transferred items to appear as well) ─────── */
    const itemQuery = {};
    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      itemQuery.$or = [
        { itemName:  re },
        { itemCode:  re },
        { barcodes:  re }
      ];
    }
    if (["online", "offline"].includes((req.query.visibility||"").toLowerCase())) {
  itemQuery.isOnline = req.query.visibility.toLowerCase() === "online";
}

    /* ── 3. Fetch *all* matching items once (no limit), with refs ─ */
    const rawItems = await Item.find(itemQuery)
      .populate("warehouse",       "warehouseName")
      .populate("category",        "name")
      .populate("subCategory",     "name")
      .populate("subSubCategory",  "name")
      .lean();

    /* ── 4. Build 8 stock-totals maps in ONE Promise.all ──── */
    const stockMaps = await buildStockMaps(warehouseOid);
    console.log("map")
    console.log(stockMaps.auditMap);
    /* helper for O(1) lookups */
    const g = (map, k) => map[k] || 0;

    /* fetch warehouse doc (for label) just once */
    const warehouseDoc = warehouseOid
      ? await Warehouse.findById(warehouseOid).select("warehouseName").lean()
      : null;

    /* ── 5. Flatten items + variants with stock maths ─────── */
    const flattened = rawItems.flatMap(item => {
      const homeWid = item.warehouse?._id.toString();

      const makeRow = (id, variantDoc = null) => {
        const k        = id.toString();
        const opening  =
          !warehouseOid || warehouseOid.toString() === homeWid
            ? (variantDoc ? variantDoc.openingStock : item.openingStock) || 0
            : 0;

        const totals = {
          totalAdjustment   : g(stockMaps.adjMap,   k),
          totalIn           : g(stockMaps.inMap,    k),
          totalOut          : g(stockMaps.outMap,   k),
          totalPurchased    : g(stockMaps.purMap,   k),
          totalReturned     : g(stockMaps.rtMap,    k),
          totalSold         : g(stockMaps.posMap,   k),
          totalSalesSold    : g(stockMaps.saleMap,  k),
          totalReturnedSold : g(stockMaps.srtMap,   k),
          auditAdjust       :g(stockMaps.auditMap,k)
        };

        const currentStock =
          opening
          + totals.totalPurchased   - totals.totalReturned
          + totals.totalAdjustment  + totals.totalIn
          - totals.totalOut         - totals.totalSold
          - totals.totalSalesSold   + totals.totalReturnedSold + totals.auditAdjust;

        return {
          ...item,
          _id: k,
          parentItemId: variantDoc ? item._id : undefined,
          itemGroup   : variantDoc ? "Variant" : "Single",
          itemName    : variantDoc
                        ? `${item.itemName} – ${variantDoc.variantId.variantName}`
                        : item.itemName,
          itemCode    : item.itemCode,
          barcodes    : variantDoc?.barcodes ?? item.barcodes,
          salesPrice  : variantDoc?.salesPrice  ?? item.salesPrice,
          purchasePrice: variantDoc?.purchasePrice ?? item.purchasePrice,
          priceWithoutTax: variantDoc?.priceWithoutTax ?? item.priceWithoutTax,
          discount    : variantDoc?.discount ?? item.discount,
          mrp         : variantDoc?.mrp ?? item.mrp,
          sku         : variantDoc?.sku ?? item.sku,
          hsn         : variantDoc?.hsn ?? item.hsn,
          expiryDate  : variantDoc?.expiryDate ?? item.expiryDate,
          openingStock: opening,
          ...totals,
          currentStock,
          isOnline     : item.isOnline ?? true,
          warehouse   : warehouseDoc || item.warehouse,
          category    : item.category,
          brand       : item.brand,
          itemImages  : item.itemImages,
          masterImage:item.masterImage
        };
      };

      return item.itemGroup === "Variant"
        ? item.variants.map(v => makeRow(v._id, v))
        : [makeRow(item._id)];
    });
    const onlyInStock = ["1","true","yes"].includes((inStock||"").toLowerCase());
    const wantZeros = ["1","true","yes"]
    .includes((req.query.includeZero || "").toLowerCase());
   

   // ── 6.  Apply warehouse / stock filter ───────────────────────────────
const widStr = warehouseOid ? warehouseOid.toString() : null;

const hasActivity = r =>
  r.openingStock          ||
  r.totalPurchased        ||
  r.totalAdjustment       ||
  r.totalIn               ||
  r.totalOut              ||
  r.totalSold             ||
  r.totalSalesSold        ||
  r.totalReturnedSold     ||
  r.totalReturned;

const filtered = warehouseOid
  ? flattened.filter(r => {
      const belongsHere = (r.warehouse?._id||"").toString() === widStr;
      if (wantZeros) {
       
        // still allow zeros when includeZero=1
        return (belongsHere || hasActivity(r));
      }
      // the default POS behavior:
      const keep = hasActivity(r) && (!onlyInStock || r.currentStock > 0);
      
      return keep;
    })
  : flattened.filter(r => {
      // when no warehouse, if inStock flag is set drop zeros,
      // otherwise return everything
      return onlyInStock ? r.currentStock > 0 : true;
    });



    /* ── 7. Client-side paging (slice) ───────────────────── */
    const start = (pageNum - 1) * limNum;
    const end   = start + limNum;
    const paged = filtered.slice(start, end);

    /* ── 8. Respond ───────────────────────────────────────── */
    return res.status(200).json({
      success: true,
      data: paged,

      pagination: {
        page       : pageNum,
        limit      : limNum,
        totalItems : filtered.length,
        totalPages : Math.ceil(filtered.length / limNum)
      }
    });
  } catch (err) {
    console.error("getAllItems error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};




//get items for auditor
exports.getItems=async(req,res)=>{
  try {
       const {warehouse}=req.params
       const items=await Item.find({warehouse})
        .populate('warehouse', 'warehouseName')
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('subSubCategory', 'name')
      .populate('brand', 'brandName')
      .populate('unit', 'unitName')
      .populate('tax', 'taxName taxPercentage')
      .populate('variants.variantId', 'variantName')

       if(!items){
        return res.status(400).json({
          message:"No item found"
        })
       }
       return res.status(200).json({
        success:true,
        message:"items fetched sucessfully",
        data:items
       })
       
  } catch (error) {
    console.log("fetching in error items",error)
    return res.status(500).json({
      message:"Internal server error",
      error:error
    })
  }
}




// GET item summaries
exports.getItemSummaries = async (req, res) => {
  try {
    const items = await Item.find()
      .select('itemImage itemName mrp salesPrice openingStock category description')
      .populate('warehouse', 'warehouseName location')
      .populate('category',  'name description');
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ───────────────────────── GET related items ───────────────────────── */

exports.getRelatedItems = async (req, res) => {
  try {
    const mainItem = await Item.findById(req.params.id);
    if (!mainItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const related = await Item.find({
      category: mainItem.category,
      _id: { $ne: mainItem._id }
    })
      .limit(4)
      .select('itemImage itemName mrp salesPrice category description')
      .populate('warehouse', 'warehouseName location')
      .populate('category',  'name description');

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ───────────────────────── GET by ID ───────────────────────── */

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('warehouse',        'warehouseName location')
      .populate('category',         'name description')
      .populate('subCategory',      'name description')
      .populate('subSubCategory',   'name description')
      .populate('tax',              'taxName taxPercentage')
      .populate('unit',             'unitName')
      .populate('variants.variantId', 'variantName description status');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    /* ── 0. utilities ───────────────────────────────────────────────── */
    const toId = (v) => {
      // 24-hex string ➜ keep
      if (typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v)) return v;

      // already an object ➜ collapse to _id
      if (v && typeof v === "object" && v._id) return v._id;

      // maybe a JSON-encoded object string
      if (typeof v === "string") {
        try {
          const o = JSON.parse(v);
          if (o && o._id) return o._id;
        } catch { /* ignore */ }
      }
      return v; // let mongoose complain if something unexpected sneaks through
    };

    const REF_FIELDS = [
      "brand",
      "category",
      "subCategory",
      "subSubCategory",
      "unit",
      "tax",
      "warehouse",
    ];

    const files = req.files || [];

    /* ── 1. reverse the old opening stock ───────────────────────────── */
    const old = await Item.findById(req.params.id).lean();
    if (!old)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    await updateInventory(old.warehouse, old._id, -(old.openingStock || 0));

    /* ── 2. normalise the incoming body ─────────────────────────────── */
    const body = { ...req.body };

    REF_FIELDS.forEach((f) => {
      if (body[f] !== undefined) body[f] = toId(body[f]);
    });

    // make sure barcodes is always an array
    if (body.barcodes && !Array.isArray(body.barcodes)) body.barcodes = [];

    // variants may be sent as stringified JSON
    let variants = body.variants;
    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch {
        variants = [];
      }
    }
    if (!Array.isArray(variants)) variants = [];

    /* ── 3. construct the update doc ────────────────────────────────── */
    const update = {
      // simple scalar / ref fields first
      itemName: body.itemName,
      brand: body.brand,
      category: body.category,
      subCategory: body.subCategory,
      subSubCategory: body.subSubCategory,
      unit: body.unit,
      itemGroup: body.itemGroup,
      alertQuantity: body.alertQuantity,
      sellerPoints: body.sellerPoints,
      description: body.description,
      discountType: body.discountType,
      discount: body.discount,
      discountPolicy: body.discountPolicy,
      requiredQuantity: body.requiredQuantity,
      freeQuantity: body.freeQuantity,
      tax: body.tax,
      expiryDate: body.expiryDate,
      warehouse: body.warehouse,
      openingStock: body.openingStock,
    };

    // on/off-line switch
    if (body.isOnline !== undefined)
      update.isOnline = body.isOnline === true || body.isOnline === "true";

    /* ── 3a. single vs variant specific fields ──────────────────────── */
    if (body.itemGroup === "Single") {
      Object.assign(update, {
        sku: body.sku,
        hsn: body.hsn,
        barcodes: body.barcodes,
        priceWithoutTax: +body.priceWithoutTax || 0,
        purchasePrice: +body.purchasePrice || 0,
        salesPrice: +body.salesPrice || 0,
        profitMargin: +body.profitMargin || 0,
        mrp: +body.mrp || 0,
        variants: [],
      });
    } else {
      update.variants = variants.map((v) => ({
        variantId: toId(v.variantId || v._id),
        sku: v.sku || "",
        hsn: v.hsn || "",
        barcodes: Array.isArray(v.barcodes) ? v.barcodes : [],
        priceWithoutTax: +v.priceWithoutTax || 0,
        purchasePrice: +v.purchasePrice || 0,
        salesPrice: +v.salesPrice || 0,
        mrp: +v.mrp || 0,
        profitMargin: +v.profitMargin || 0,
        openingStock: +v.openingStock || 0,
        discountPolicy: v.discountPolicy || "None",
        requiredQuantity: +v.requiredQuantity || 0,
        freeQuantity: +v.freeQuantity || 0,
      }));
    }

    /* ── 4. merge any newly uploaded images ─────────────────────────── */
    if (files.length) {
      const current = (
        await Item.findById(req.params.id).select("itemImages").lean()
      )?.itemImages || [];
      update.itemImages = current.concat(files.map((f) => f.filename));
    }

    /* ── 5. persist and populate ────────────────────────────────────── */
    const updated = await Item.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
      .populate("warehouse", "warehouseName location")
      .populate("category subCategory subSubCategory", "name description")
      .populate("brand", "brandName")
      .populate("unit", "unitName")
      .populate("tax", "taxName taxPercentage")
      .populate("variants.variantId", "variantName")
      .lean();

    /* ── 6. re-apply opening stock ──────────────────────────────────── */
    await updateInventory(
      updated.warehouse._id,
      updated._id,
      +(updated.openingStock || 0)
    );

    return res
      .status(200)
      .json({ success: true, message: "Item updated successfully", data: updated });
  } catch (err) {
    console.error("Error in updateItem:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
/* ───────────────────────── DELETE ───────────────────────── */

exports.deleteItem = async (req, res) => {
  try {
    const removed = await Item.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ───────────────────────── extra GET routes (unchanged) ───────────────────────── */

exports.getItemsNearLocation = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }
    const lat  = parseFloat(latitude);
    const lng  = parseFloat(longitude);
    const dist = maxDistance ? parseInt(maxDistance) : 5000;

    const warehouses = await Warehouse.find({
      location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: dist } }
    }).select('_id');

    if (!warehouses.length) return res.status(200).json({ success: true, data: [] });
    const ids = warehouses.map(w => w._id);

    const items = await Item.find({ warehouse: { $in: ids } })
      .select('itemImage itemName mrp salesPrice openingStock category description')
      .populate('warehouse', 'warehouseName location')
      .populate('category',  'name description');

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopTrendingItems = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const trending = await Sale.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.item', totalSold: { $sum: '$items.quantity' } } },
      { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'itemDetails' } },
      { $unwind: '$itemDetails' },
      {
        $project: {
          itemName:   '$itemDetails.itemName',
          totalSold:  1,
          salesPrice: '$itemDetails.salesPrice',
          itemCode:   '$itemDetails.itemCode',
          itemImage:  '$itemDetails.itemImage'
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);
    res.status(200).json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockItems = async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  try {
    const low = await Item.find({ openingStock: { $lte: threshold } })
      .select('itemName openingStock alertQuantity')
      .populate('category', 'name')
      .populate('brand',    'brandName');
    res.status(200).json({ success: true, data: low });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getItemsByCategory = async (req, res) => {
  try {
    const items = await Item.find({ category: req.params.categoryId })
      .populate('warehouse', 'warehouseName location')
      .populate('category',  'name description')
      .populate('brand',     'brandName description')
      .populate('tax',       'taxName taxPercentage')
      .populate('unit',      'unitName')
      .populate('variants.variantId', 'variantName description status');
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createItemsBulk = async (req, res) => {
  const items = req.body;
  try {
    // Ensure imageCode is included in the payload
    const updatedItems = items.map(item => ({
      ...item,
      imageCode: item.imageCode || '' // Store IMAGE CODE from CSV
    }));
    const created = await Item.insertMany(updatedItems, { ordered: false });
    // Update inventory for each item with openingStock
    for (const item of created) {
      if (item.openingStock > 0) {
        await updateInventory(item.warehouse, item._id, item.openingStock);
      }
    }
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    console.warn('Bulk import partial error:', err);
    const inserted = err.insertedDocs || [];
    res.status(207).json({ success: false, count: inserted.length, error: err.message, data: inserted });
  }
};


exports.getItemsByWarehouse = async (req, res) => {
  let { warehouse } = req.query;

  if (!warehouse) {
    return res.status(400).json({ success: false, message: 'warehouse query param is required' });
  }

  // Remove extra quotes if someone passes them
  warehouse = warehouse.replace(/["']/g, '');

  if (!warehouse.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: 'Invalid warehouse ID' });
  }

  try {
    const items = await Item.find({ warehouse })
      .populate("brand")
      .populate("category")
      .populate("subCategory")
      .populate("subSubCategory")
      .populate("unit")
      .populate("tax")
      .populate("warehouse");

    res.json(items);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// In itemController.js
exports.uploadImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    const uploadedImages = {};
    files.forEach((file) => {
      uploadedImages[file.originalname] = file.filename;
    });
    res.status(200).json({ success: true, uploadedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteItemImage = async (req, res) => {
  try {
    const { id, filename } = req.params;

    // 1) Remove filename from the Item document
    await Item.findByIdAndUpdate(id, {
      $pull: { itemImages: filename }
    });

    // 2) Delete the physical file from disk
    const fullPath = path.join(
      __dirname,
      "..",
      "uploads",
      "qr",
      "items",
      filename
    );
    fs.unlink(fullPath, (err) => {
      if (err) console.error("Could not delete file:", fullPath, err);
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};





exports.DifferentiateItemByCategory=async(req,res)=>{
   try {
    const items = await Item.find();

    const grouped = {};

    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    res.status(200).json({
      success: true,
      message: "Items grouped by category",
      data: grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while grouping items",
      error: error.message,
    });
  }
}


// const Item = require("../models/Item"); // Adjust path to your Item model

exports.getCategoryWiseImages = async (req, res) => {
  try {
    const items = await Item.find({ masterImage: { $exists: true, $ne: "" } });

    const groupedImages = {};

    // Group images by category
    items.forEach(item => {
      const category = item.category || "Uncategorized";
      const imageUrl = `http://localhost:5000/uploads/${item.masterImage}`;

      if (!groupedImages[category]) {
        groupedImages[category] = [];
      }

      groupedImages[category].push(imageUrl);
    });

    const result = {};

    for (const category in groupedImages) {
      const images = groupedImages[category];
      
      // Limit to 20 images max
      const limitedImages = images.slice(0, 20);
      
      // Ensure even number of images
      const evenCount = limitedImages.length - (limitedImages.length % 2);
      const evenImages = limitedImages.slice(0, evenCount);
      
      // Split into pairs of 2
      const pairedImages = [];
      for (let i = 0; i < evenImages.length; i += 2) {
        pairedImages.push([evenImages[i], evenImages[i + 1]]);
      }

      result[category] = pairedImages;
    }

    return res.status(200).json({
      success: true,
      message: "Images grouped by category in pairs",
      data: result
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing items",
      error: error.message
    });
  }
};


const { mergeImages } = require("../helpers/imageMerger");


//category
const FILES_BASE = path.resolve(__dirname, "../uploads/qr/items");
const OUTPUT_BASE = path.resolve(__dirname, "../uploads/merged-items");


// exports.getMergedCategoryImages = async (req, res) => {
//   try {
//     const items = await Item.find({ masterImage: { $exists: true, $ne: "" } });

//     const grouped = {};

//     // Group items by category
//     items.forEach(item => {
//       const category = item.category || "Uncategorized";
//       const imagePath = item.masterImage;
//       if (!grouped[category]) grouped[category] = [];
//       grouped[category].push(imagePath);
//     });

//     const finalResult = {};

//   for (const category in grouped) {
//   const images = grouped[category];
    
//   const trimmedImages = images.slice(0, 4);
//   const evenCount = trimmedImages.length - (trimmedImages.length % 2);
//   const imagePairs = trimmedImages.slice(0, evenCount);

//   const mergedResults = [];

//   for (let i = 0; i < imagePairs.length; i += 2) {
//     const image1Path = path.join(FILES_BASE, imagePairs[i]);
//     const image2Path = path.join(FILES_BASE, imagePairs[i + 1]);

// if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
//   console.warn("❌ Skipping missing files:", image1Path, image2Path);
//   continue;
// }
//    console.log("path1",image1Path)
//    console.log("path2",image2Path)
//     const outputFileName = `merged-${category.replace(/\s+/g, "_").toLowerCase()}-${i}.png`;
//     console.log("outputfilename",outputFileName)
//     const outputPath = path.join(OUTPUT_BASE, outputFileName);
//     console.log("outputpath",outputPath)
//     fs.mkdirSync(OUTPUT_BASE, { recursive: true });
    
//     const mergeResult = await mergeImages(image1Path, image2Path, { outputPath });
//     console.log("Merged:", mergeResult);

//     // Example: http://yourdomain.com/uploads/merged-items/merged-category-0.png
//     mergedResults.push(`https://pos.inspiredgrow.in/vps/uploads/merged-items/${outputFileName}`);
//   }

//   finalResult[category] = mergedResults;
// }

//     return res.status(200).json({
//       success: true,
//       message: "Merged category-wise item images returned in pairs",
//       data: finalResult,
//     });

//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };

exports.getMergedCategoryImages = async (req, res) => {
  try {
    const items = await Item.find({ masterImage: { $exists: true, $ne: "" } });

    const grouped = {};

    // Group items by category
    items.forEach(item => {
      const category = item.category?.toString() || "Uncategorized";
      const imagePath = item.masterImage;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(imagePath);
    });

    const finalResult = {};
    const MAX_IMAGES = 20;

    for (const category in grouped) {
      let images = grouped[category];
      
      // Shuffle the images randomly
      images = shuffleArray(images);

      // Limit to 20 and ensure even number
      images = images.slice(0, MAX_IMAGES);
      if (images.length % 2 !== 0) {
        images.pop(); // remove last if odd
      }

      const mergedResults = [];

      for (let i = 0; i < images.length; i += 2) {
        const image1Path = path.join(FILES_BASE, images[i]);
        const image2Path = path.join(FILES_BASE, images[i + 1]);

        if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
          console.warn("❌ Skipping missing files:", image1Path, image2Path);
          continue;
        }

        const outputFileName = `merged-${category.replace(/\s+/g, "_").toLowerCase()}-${i}.png`;
        const outputPath = path.join(OUTPUT_BASE, outputFileName);

        fs.mkdirSync(OUTPUT_BASE, { recursive: true });

        await mergeImages(image1Path, image2Path, { outputPath });

        mergedResults.push(`/vps/uploads/merged-items/${outputFileName}`);
      }

      finalResult[category] = mergedResults;
    }

    return res.status(200).json({
      success: true,
      message: "Random merged category-wise images (max 20, even only)",
      data: finalResult,
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.generateMergedImagesForCategory = async (req, res) => {
  try {
const rawCategoryId = req.query.categoryId || req.body.categoryId;
const categoryId = rawCategoryId?.replace(/^"|"$/g, ""); // removes leading/trailing double quotes
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let items = await Item.find({
      category: categoryId,
      masterImage: { $exists: true, $ne: "" }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    items = shuffleArray(items);

    if (!items || items.length < 2) {
      return res.status(200).json([]);
    }
      console.log(items)
    const mergedUrls = [];
    const FILES_BASE = path.resolve(__dirname, "../uploads/qr/items");
    const OUTPUT_DIR = path.resolve(__dirname, "../uploads/merged");

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (let i = 0; i < items.length - 1; i += 2) {
      const img1 = path.join(FILES_BASE, path.basename(items[i].masterImage));
      const img2 = path.join(FILES_BASE, path.basename(items[i + 1].masterImage));

      if (!fs.existsSync(img1) || !fs.existsSync(img2)) {
        console.warn("Missing files:", img1, img2);
        continue;
      }

const timestamp = Date.now();
const outputFileName = `merged-${categoryId}-${page}-${i}-${timestamp}.png`;
      const outputPath = path.join(OUTPUT_DIR, outputFileName);

      await mergeImages(img1, img2, { outputPath });

      mergedUrls.push(`/vps/uploads/merged/${outputFileName}`);
    }

    return res.status(200).json(mergedUrls);
  } catch (error) {
    console.error("Error generating merged images:", error);
    return res.status(500).json([]);
  }
};









//sub 



exports.DifferentiateItemBysubCategory=async(req,res)=>{
   try {
    const items = await Item.find();

    const grouped = {};

    items.forEach((item) => {
      if (!grouped[item.subCategory]) {
        grouped[item.subCategory] = [];
      }
      grouped[item.subCategory].push(item);
    });
    res.status(200).json({
      success: true,
      message: "Items grouped by category",
      data: grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while grouping items",
      error: error.message,
    });
  }
}


exports.getMergedSubCategoryImages=async(req,res)=>{
   try {
    const items = await Item.find({ masterImage: { $exists: true, $ne: "" } });

    const grouped = {};

    // Group items by subcategory
    items.forEach(item => {
      const subcategory = item.subCategory || "Uncategorized";
      const imagePath = item.masterImage;
      if (!grouped[subcategory]) grouped[subcategory] = [];
      grouped[subcategory].push(imagePath);
    });

    const finalResult = {};
    const MAX_IMAGES = 20;

    for (const subcategory in grouped) {
      let images = grouped[subcategory];
         
      // Shuffle the images randomly
      images = shuffleArray(images);


      // Limit to 20 and ensure even number
      images = images.slice(0, MAX_IMAGES);
      if (images.length % 2 !== 0) {
        images.pop(); // remove last if odd
      }

     
     
      const mergedResults = [];
        for (let i = 0; i < images.length; i += 2) {
        const image1Path = path.join(FILES_BASE, images[i]);
        const image2Path = path.join(FILES_BASE, images[i + 1]);

        if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
          console.warn("❌ Skipping missing files:", image1Path, image2Path);
          continue;
        }

        const outputFileName = `merged-${subcategory.replace(/\s+/g, "_").toLowerCase()}-${i}.png`;
        const outputPath = path.join(OUTPUT_BASE, outputFileName);

        fs.mkdirSync(OUTPUT_BASE, { recursive: true });

        await mergeImages(image1Path, image2Path, { outputPath });

        mergedResults.push(`/vps/uploads/merged-items/${outputFileName}`);
      }

      finalResult[subcategory] = mergedResults;
    }

    return res.status(200).json({
      success: true,
      message: "Merged subcategory-wise item images returned in pairs",
      data: finalResult,
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}



exports.generateMergedImagesForSubCategory = async (req, res) => {
  try {
  const rawsubCategoryId = req.query.subcategoryId || req.body.subcategoryId;
const subcategoryId = rawsubCategoryId?.replace(/^"|"$/g, ""); // removes leading/trailing double quotes
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 20;
    const skip = (page - 1) * limit;

    // Fetch paginated items with images
    let items = await Item.find({ 
      subCategory: subcategoryId,
      masterImage: { $exists: true, $ne: "" }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    items = shuffleArray(items);


    if (!items || items.length < 2) {
      return res.status(200).json([]);
    }

    const mergedUrls = [];
 const FILES_BASE = path.resolve(__dirname, "../uploads/qr/items");
    const OUTPUT_DIR = path.resolve(__dirname, "../uploads/merged");

    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    
    for (let i = 0; i < items.length - 1; i += 2) {
      const img1 = path.join(FILES_BASE, path.basename(items[i].masterImage));
      const img2 = path.join(FILES_BASE, path.basename(items[i + 1].masterImage));

      if (!fs.existsSync(img1) || !fs.existsSync(img2)) {
        console.warn("Missing files:", img1, img2);
        continue;
      }

      
      const outputPath = path.join("uploads/merged", `merged-${subcategoryId}-${page}-${i}.png`);
      await mergeImages(img1, img2, { outputPath });

      mergedUrls.push(`/uploads/merged/${path.basename(outputPath)}`);
    }

    return res.status(200).json(mergedUrls);

  } catch (error) {
    console.error("Error generating merged images:", error);
    return res.status(500).json([]);
  }
};




//subsub


exports.DifferentiateItemBysubsubCategory=async(req,res)=>{
   try {
    const items = await Item.find();

    const grouped = {};

    items.forEach((item) => {
      if (!grouped[item.subSubCategory]) {
        grouped[item.subSubCategory] = [];
      }
      grouped[item.subSubCategory].push(item);
    });
    res.status(200).json({
      success: true,
      message: "Items grouped by category",
      data: grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while grouping items",
      error: error.message,
    });
  }
}




exports.getMergedSubSubCategoryImages=async(req,res)=>{
   try {
    const items = await Item.find({ masterImage: { $exists: true, $ne: "" } });

    const grouped = {};

    // Group items by category
    items.forEach(item => {
      const subcategory = item.subSubCategory || "Unsubsubcategorized";
      const imagePath = item.masterImage;
      if (!grouped[subcategory]) grouped[subcategory] = [];
      grouped[subcategory].push(imagePath);
    });

 const finalResult = {};
    const MAX_IMAGES = 20;


    for (const subcategory in grouped) {
      let images = grouped[subcategory];

      // Shuffle the images randomly      
      images = shuffleArray(images);

      
      // Limit to 20 and ensure even number
      images = images.slice(0, MAX_IMAGES);
      if (images.length % 2 !== 0) {
        images.pop(); // remove last if odd
      }
      
      const mergedResults = [];
      
       for (let i = 0; i < images.length; i += 2) {
        const image1Path = path.join(FILES_BASE, images[i]);
        const image2Path = path.join(FILES_BASE, images[i + 1]);

        if (!fs.existsSync(image1Path) || !fs.existsSync(image2Path)) {
          console.warn("❌ Skipping missing files:", image1Path, image2Path);
          continue;
        }

        const outputFileName = `merged-${subcategory.replace(/\s+/g, "_").toLowerCase()}-${i}.png`;
        const outputPath = path.join(OUTPUT_BASE, outputFileName);

        fs.mkdirSync(OUTPUT_BASE, { recursive: true });

        await mergeImages(image1Path, image2Path, { outputPath });

        mergedResults.push(`/vps/uploads/merged-items/${outputFileName}`);
      }

      finalResult[subcategory] = mergedResults;
    }

    return res.status(200).json({
      success: true,
      message: "Merged category-wise item images returned in pairs",
      data: finalResult,
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
}



exports.generateMergedImagesForSubSubCategory = async (req, res) => {
  try {
     const rawsubCategoryId = req.query.subSubCategoryId || req.body.subSubCategoryId;
     const subcategoryId = rawsubCategoryId?.replace(/^"|"$/g, ""); // removes leading/trailing double quotes

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 20;
    const skip = (page - 1) * limit;

    // Fetch paginated items with images
    let items = await Item.find({ 
      subSubCategory: subcategoryId,
      masterImage: { $exists: true, $ne: "" }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    items=shuffleArray(items);

    if(!items || items.length<2){
      return res.status(200).json([]);
    }
     

     const mergedUrls = [];
     const FILES_BASE = path.resolve(__dirname,"../uploads/qr/items");
     const OUTPUT_DIR = path.resolve(__dirname,"../uploads/merged");

        fs.mkdirSync(OUTPUT_DIR, { recursive: true });


    for (let i = 0; i < items.length - 1; i += 2) {
      const img1 = path.resolve(__dirname, "../uploads", path.basename(items[i].masterImage));
      const img2 = path.resolve(__dirname, "../uploads", path.basename(items[i + 1].masterImage));

      if (!fs.existsSync(img1) || !fs.existsSync(img2)) continue;

      const outputPath = path.join("uploads/merged", `merged-${subcategoryId}-${page}-${i}.png`);
      await mergeImages(img1, img2, { outputPath });

      mergedUrls.push(`/uploads/merged/${path.basename(outputPath)}`);
    }



    return res.status(200).json(mergedUrls);

  } catch (error) {
    console.error("Error generating merged images:", error);
    return res.status(500).json([]);
  }
};











//assign master image for all 


exports.assignMasterImage=async(req,res)=>{
  try {
      const{id,image}=req.body;
      if(!id || !image){
        return res.status(400).json({
          message:"All fields are required"
        })
      }


      const itemExist=await Item.findById(id)
      if(!itemExist){
        return res.status(404).json({
          message:"Item not found"
        })
      }
      const itemUpdate=await Item.findByIdAndUpdate(id,{
        masterImage:image
      })
      if(!itemUpdate){
        return res.status(400).json({
          message:"Unable to update"
        })
      }
      return res.status(200).json({
        success:true,
        data:itemUpdate,
        message:"Master image assign successfully"
      })
  } catch (error) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

exports.assignMasterImageForCategory=async(req,res)=>{
  try {
      const{id,image}=req.body;
      if(!id || !image){
        return res.status(400).json({
          message:"All fields are required"
        })
      }


      const CatExist=await Category.findById(id)
      if(!CatExist){
        return res.status(404).json({
          message:"Item not found"
        })
      }

      const CatUpdate=await Category.findByIdAndUpdate(id,{
        masterImage:image
      })
      
      if(!CatUpdate){
        return res.status(400).json({
          message:"Unable to update"
        })
      }
      return res.status(200).json({
        data:CatUpdate,
        success:true,
        message:"Master image assign successfully"
      })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

exports.assignMasterImageForSubCategory=async(req,res)=>{
  try {
      const{id,image}=req.body;
      if(!id || !image){
        return res.status(400).json({
          message:"All fields are required"
        })
      }


      const subCatExist=await SubCategory.findById(id)
      if(!subCatExist){
        return res.status(404).json({
          message:"Item not found"
        })
      }

      const subCatUpdate=await SubCategory.findByIdAndUpdate(id,{
        masterImage:image
      })
      
      if(!subCatUpdate){
        return res.status(400).json({
          message:"Unable to update"
        })
      }
      return res.status(200).json({
        success:true,
        message:"Master image assign successfully"
      })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

exports.assignMasterImageForSubSubCategory=async(req,res)=>{
  try {
      const{id,image}=req.body;
      if(!id || !image){
        return res.status(400).json({
          message:"All fields are required"
        })
      }


      const subCatExist=await SubSubCat.findById(id)
      if(!subCatExist){
        return res.status(404).json({
          message:"Item not found"
        })
      }
      const subCatUpdate=await SubSubCat.findByIdAndUpdate(id,{
        masterImage:image
      })
      if(!subCatUpdate){
        return res.status(400).json({
          message:"Unable to update"
        })
      }
      return res.status(200).json({
        success:true,
        message:"Master image assign successfully"
      })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}



// controllers/item.js
// controllers/item.js
{/*exports.getItemSearch = async (req, res) => {
  try {
    const {
      warehouse: wId,
      q = "",
      limit = 20
    } = req.query;

    
    const PROJECTION = `
      itemName itemCode barcodes
      salesPrice mrp warehouse
      variants.variantId
      variants.salesPrice variants.mrp variants.barcodes
    `;

    const re    = new RegExp(q.trim(), "i");
    const query = q
      ? { $or: [{ itemName: re }, { itemCode: re }, { barcodes: re }] }
      : {};

    let rows = await Item.find(query)
      .select(PROJECTION)
      .limit(Number(limit))
      .populate("variants.variantId", "variantName")
      .lean();

    
    let stockMap = {};
    if (wId) {
      stockMap = await buildStockMaps(wId);     // { itemOrVariantId: qty }
    }

    
    const flattened = rows.flatMap((item) => {
      const baseStock = wId ? stockMap[item._id] ?? 0 : undefined;

      // parent row
      const list = [
        {
          ...item,
          _id        : item._id,
          parentId   : item._id,
          variantId  : null,
          itemName   : item.itemName,
          currentStock: baseStock,
        },
      ];

      // each variant as its own row
      item.variants?.forEach((v) => {
        const vStock = wId ? stockMap[v._id] ?? 0 : undefined;

        list.push({
          ...item,                        // inherit parent fields
          _id       : v._id,
          parentId  : item._id,
          variantId : v._id,
          itemName  : `${item.itemName} / ${v.variantId.variantName}`,
          salesPrice: v.salesPrice ?? item.salesPrice,
          mrp       : v.mrp        ?? item.mrp,
          barcodes  : v.barcodes   ?? item.barcodes,
          currentStock: vStock,
        });
      });

      return list;
    });

   
    res.json({
      success: true,
      data   : flattened.slice(0, Number(limit)),
    });
  } catch (err) {
    console.error("search error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};*/}


{/*exports.fetchImagesFromS3 = async (req, res) => {
  const codes          = Array.isArray(req.body.keys)
                         ? [...new Set(req.body.keys)]
                         : [];
  const uploadedImages = {};
  const filenameToS3Key = {};
  const notFound       = [];

  try {
    // 1️. page through every object in the bucket
    let ContinuationToken = undefined;
    const allObjs = [];
    do {
      const resp = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken
      }));
      allObjs.push(...(resp.Contents || []));
      ContinuationToken = resp.IsTruncated
        ? resp.NextContinuationToken
        : null;
    } while (ContinuationToken);

    // 2️. for each code, find matches, pull the first match
   for (const code of codes) {
  const matches = allObjs.filter(o =>
    o.Key.toLowerCase().includes(code)
  );
  if (!matches.length) {
    notFound.push(code);
    continue;
  }

  uploadedImages[code] = [];
  for (const obj of matches) {
    const fname = await pullFromS3(obj.Key);
    uploadedImages[code].push(fname);
     //filenameToS3Key[fname] = obj.Key;
  }
}


    return res.json({ success: true, uploadedImages, notFound });
  } catch (err) {
    console.error('[S3-pull]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};*/}

// exports.autocomplete = async (req, res) => {

//   try {
//     // 1️⃣ Read & sanitize inputs
//     const term = (req.query.search || "").trim();
//     if (!term) return res.json({ success: true, data: [] });
//     const lim = Math.max(parseInt(req.query.limit) || 10, 1);
//      console.log("Autocomplete term:", term, "Limit:", lim);
//     // 2️⃣ Build your regex (remove the leading ^ if you want substring match)
//     const esc = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
//     const re  = new RegExp("^" + esc(term), "i");

//     // 3️⃣ Fetch all *online* items that match name/code/barcode
//     const candidates = await Item.find({
//       isOnline: true,
//       $or: [
//         { itemName: re },
//         { itemCode: re },
//         { barcodes:   re }
//       ]
//     })
//     // we’ll need openingStock, variants, and warehouse to compute stock
//     .select("itemName itemCode barcodes openingStock itemGroup variants masterImage itemImages warehouse")
//     .lean();

//     // 4️⃣ Build the stock‐maps once (null => aggregate across all warehouses)
//     const stockMaps = await buildStockMaps(null);
//     const g = (map, k) => map[k] || 0;

//     // 5️⃣ For each candidate (and its variants), compute currentStock
//     const matches = candidates.flatMap(item => {
//       const makeRow = (id, vDoc = null) => {
//         const k = id.toString();

//         // Opening stock always counts when aggregating across all WHs
//         const opening = vDoc
//           ? (vDoc.openingStock || 0)
//           : (item.openingStock   || 0);

//         // Totals from all flows
//         const totals = {
//           totalAdjustment   : g(stockMaps.adjMap,   k),
//           totalIn           : g(stockMaps.inMap,    k),
//           totalOut          : g(stockMaps.outMap,   k),
//           totalPurchased    : g(stockMaps.purMap,   k),
//           totalReturned     : g(stockMaps.rtMap,    k),
//           totalSold         : g(stockMaps.posMap,   k),
//           totalSalesSold    : g(stockMaps.saleMap,  k),
//           totalReturnedSold : g(stockMaps.srtMap,   k),
//         };

//         const currentStock =
//           opening
//           + totals.totalPurchased   - totals.totalReturned
//           + totals.totalAdjustment  + totals.totalIn
//           - totals.totalOut         - totals.totalSold
//           - totals.totalSalesSold   + totals.totalReturnedSold;

//         // drop anything not truly in stock
//         if (currentStock <= 0) return null;

//         // pick a representative image
//         const image = item.masterImage || item.itemImages?.[0] || null;

//         return {
//           _id:         k,
//           itemName:    vDoc
//                          ? `${item.itemName} / ${vDoc.variantName}`
//                          : item.itemName,
//           itemCode:    item.itemCode,
//           barcode:     (vDoc?.barcodes ?? item.barcodes)[0] || null,
//           salesPrice:  vDoc?.salesPrice ?? item.salesPrice,
//           mrp:         vDoc?.mrp        ?? item.mrp,
//           image,
//           currentStock
//         };
//       };

//       // flatten variants vs. single
//       return item.itemGroup === "Variant"
//         ? item.variants.map(v => makeRow(v._id, v)).filter(x => x)
//         : [ makeRow(item._id, null) ].filter(x => x);
//     });

//     // 6️⃣ Return only the top `lim` results
//     const data = matches.slice(0, lim);
//     return res.json({ success: true, data });

//   } catch (err) {
//     console.error("autocomplete:", err);
//     return res.status(500).json({ success: false, message: "Internal error" });
//   }
// };

exports.autocomplete = async (req, res) => {
  try {
    // 1️⃣ Read & sanitize inputs
    const term = (req.query.search || "").trim();
    if (!term) return res.json({ success: true, data: [] });

    const lim = Math.max(parseInt(req.query.limit) || 10, 1);
    console.log("Limit:", lim);
    console.log(term)
    // 2️⃣ Fetch all online items (minimal fields for Fuse.js search)
    const allItems = await Item.find({ isOnline: true })
      .select(
        "itemName itemCode barcodes openingStock itemGroup variants masterImage itemImages warehouse brand category subCategory subSubCategory salesPrice mrp"
      )
      .lean();

    // 3️⃣ Fuse.js fuzzy search
    const fuse = new Fuse(allItems, {
      keys: ["itemName", "itemCode", "barcodes"],
      threshold: 0.3, // adjust for typo tolerance (0 = exact, 1 = very fuzzy)
    });

    const primaryResults = fuse.search(term).map(r => r.item);

    if (!primaryResults.length) return res.json({ success: true, data: [] });

    // 4️⃣ Extract brands & categories from primary results
    const matchedBrands = [...new Set(primaryResults.map(i => i.brand).filter(Boolean))];
    const matchedCategories = [...new Set(primaryResults.map(i => i.category).filter(Boolean))];
    const matchedSubCategories = [...new Set(primaryResults.map(i => i.subCategory).filter(Boolean))];
    const matchedSubSubCategories = [...new Set(primaryResults.map(i => i.subSubCategory).filter(Boolean))];

    // 5️⃣ Get extra items by brand or category
    const extraItems = allItems.filter(
      i =>
        matchedBrands.includes(i.brand) ||
        matchedCategories.includes(i.category) ||
        matchedSubCategories.includes(i.subCategory) ||
        matchedSubSubCategories.includes(i.subSubCategory)
    );

    // 6️⃣ Merge & remove duplicates
    const uniqueMap = new Map();
    [...primaryResults, ...extraItems].forEach(i => uniqueMap.set(i._id.toString(), i));
    const uniqueItems = Array.from(uniqueMap.values());

    // 7️⃣ Build stock maps
    const stockMaps = await buildStockMaps(null);
    const g = (map, k) => map[k] || 0;

    // 8️⃣ Compute currentStock for each item & its variants
    const matches = uniqueItems.flatMap(item => {
      const makeRow = (id, vDoc = null) => {
        const k = id.toString();
        const opening = vDoc?.openingStock ?? item.openingStock ?? 0;

        const totals = {
          totalAdjustment: g(stockMaps.adjMap, k),
          totalIn: g(stockMaps.inMap, k),
          totalOut: g(stockMaps.outMap, k),
          totalPurchased: g(stockMaps.purMap, k),
          totalReturned: g(stockMaps.rtMap, k),
          totalSold: g(stockMaps.posMap, k),
          totalSalesSold: g(stockMaps.saleMap, k),
          totalReturnedSold: g(stockMaps.srtMap, k),
        };

        const currentStock =
          opening +
          totals.totalPurchased -
          totals.totalReturned +
          totals.totalAdjustment +
          totals.totalIn -
          totals.totalOut -
          totals.totalSold -
          totals.totalSalesSold +
          totals.totalReturnedSold;

        if (currentStock <= 0) return null;

        const image = item.masterImage || item.itemImages?.[0] || null;

        return {
          _id: k,
          itemName: vDoc ? `${item.itemName} / ${vDoc.variantName}` : item.itemName,
          itemCode: item.itemCode,
          barcode: (vDoc?.barcodes ?? item.barcodes)?.[0] || null,
          salesPrice: vDoc?.salesPrice ?? item.salesPrice,
          mrp: vDoc?.mrp ?? item.mrp,
          image,
          currentStock,
        };
      };

      return item.itemGroup === "Variant"
        ? item.variants.map(v => makeRow(v._id, v)).filter(x => x)
        : [makeRow(item._id, null)].filter(x => x);
    });

    // 9️⃣ Return top `lim` results
    const data = matches.slice(0, lim);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("autocomplete:", err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};
