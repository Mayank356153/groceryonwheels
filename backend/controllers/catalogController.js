const mongoose        = require("mongoose");
const Item            = require("../models/itemModel");
const Category        = require("../models/categoryModel");
const SubCategory     = require("../models/subCategoryModel");
const SubSubCategory  = require("../models/subSubCategoryModel");
const Store           = require("../models/storeModel");
const Warehouse       = require("../models/warehouseModel");
const { buildStockMaps } = require("../helpers/stockMaps");

/* ---------------------------------------------------------------- helpers */
const toOid = (id) => new mongoose.Types.ObjectId(id);
const bad   = (id) => !mongoose.Types.ObjectId.isValid(id);

/* quick map getter */
const g = (map, key) => (map && map[key]) || 0;

/* Title-case helper: makes "health care" -> "Health Care" */
function titleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

/* Compute current stock for a root item OR one of its variants */
function currentStockFor(doc, maps, variant = null) {
  const k = (variant ? variant._id : doc._id).toString();
  const opening = variant ? (variant.openingStock || 0) : (doc.openingStock || 0);
  return (
    opening +
    g(maps.purMap,  k) - g(maps.rtMap,  k) +
    g(maps.adjMap,  k) + g(maps.inMap,  k) -
    g(maps.outMap,  k) - g(maps.posMap, k) -
    g(maps.saleMap, k) + g(maps.srtMap, k)
  );
}

/* Build one stock-map, cache for the request */
async function getMapsOnce(req) {
  if (!req.__stockMaps) req.__stockMaps = await buildStockMaps(null);
  return req.__stockMaps;
}

/* Get warehouse IDs associated with stores
   - Public API safe (no req.user)
   - Caches result on req.__restrictedWarehouseIds
   - Returns array of string IDs (or [] if none)
*/
async function getRestrictedWarehouseIds(req) {
  if (req.__restrictedWarehouseIds) return req.__restrictedWarehouseIds;

  const stores = await Store.find({ warehouse: { $exists: true, $ne: null } })
    .select("warehouse")
    .lean();

  const ids = stores
    .map(s => String(s.warehouse))
    .filter(id => mongoose.Types.ObjectId.isValid(id));

  req.__restrictedWarehouseIds = ids;
  return ids;
}

/* ----------------------------------------------------------------- EXPORTS */

/* ─────────────────────── 1. CATEGORIES ───────────────────── */
/* GET /vps/api/catalog/categories */
exports.listCategories = async (req, res) => {
  try {
    const restrictedIds = await getRestrictedWarehouseIds(req);
    if (!restrictedIds.length) return res.json({ success: true, data: [] });

    const items = await Item.find({ isOnline: true })
      .select("openingStock itemGroup variants category")
      .lean();

    const maps = await getMapsOnce(req);
    const keepIds = new Set();

    items.forEach(it => {
      if (it.itemGroup === "Variant") {
        (it.variants || []).forEach(v => {
          if (currentStockFor(it, maps, v) > 0) keepIds.add(String(it.category));
        });
      } else {
        if (currentStockFor(it, maps) > 0) keepIds.add(String(it.category));
      }
    });

    if (!keepIds.size) return res.json({ success: true, data: [] });

    const cats = await Category
      .find({ _id: { $in: [...keepIds] } })
      .select("name description image")
      .lean();

    const formattedCats = cats.map(c => ({ ...c, name: titleCase(c.name) }));
    res.json({ success: true, data: formattedCats });
  } catch (err) {
    console.error("catalog.listCategories error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ──────────── 2. SUB-CATEGORIES INSIDE ONE CATEGORY ───────── */
/* GET /vps/api/catalog/:catId/subcategories */
exports.listSubCategories = async (req, res) => {
  const { catId } = req.params;
  if (bad(catId)) return res.status(400).json({ message: "Invalid category id" });

  try {
    const restrictedIds = await getRestrictedWarehouseIds(req);
    if (!restrictedIds.length) return res.json({ success: true, data: [] });

    const items = await Item.find({ isOnline: true, category: catId })
      .select("openingStock itemGroup variants subCategory")
      .lean();

    const maps = await getMapsOnce(req);
    const keepIds = new Set();

    items.forEach(it => {
      if (it.itemGroup === "Variant") {
        (it.variants || []).forEach(v => {
          if (currentStockFor(it, maps, v) > 0) keepIds.add(String(it.subCategory));
        });
      } else {
        if (currentStockFor(it, maps) > 0) keepIds.add(String(it.subCategory));
      }
    });

    if (!keepIds.size) return res.json({ success: true, data: [] });

    const subs = await SubCategory
      .find({ _id: { $in: [...keepIds] } })
      .select("name description image")
      .lean();

    const formattedSubs = subs.map(s => ({ ...s, name: titleCase(s.name) }));
    res.json({ success: true, data: formattedSubs });
  } catch (err) {
    console.error("catalog.listSubCategories error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ───── 3. ‘DECKS’ → SUB-SUB-CATS + ALL THEIR ITEMS ───── */
/* GET /vps/api/catalog/:catId/subcategories/:subId/decks */
exports.listSubSubDecks = async (req, res) => {
  const { catId, subId } = req.params;
  if (bad(catId) || bad(subId)) return res.status(400).json({ message: "Invalid ids" });

  try {
    const restrictedIds = await getRestrictedWarehouseIds(req);
    if (!restrictedIds.length) return res.json({ success: true, data: [] });

    const items = await Item.find({ category: catId, subCategory: subId, isOnline: true })
      .populate("brand", "brandName")
      .populate("unit",  "unitName")
      .populate("subSubCategory", "name images")
      .select("itemName description itemImages salesPrice mrp openingStock itemGroup variants brand unit subSubCategory")
      .lean();

    const maps = await getMapsOnce(req);
    const deckMap = new Map();

    const pushItem = (ssc, card) => {
      const id = String(ssc._id);
      if (!deckMap.has(id)) deckMap.set(id, { _id: id, name: titleCase(ssc.name), banner: ssc.images?.[0] || null, items: [] });
      deckMap.get(id).items.push(card);
    };

    items.forEach(it => {
      const ssc = it.subSubCategory;
      if (!ssc) return;

      const baseCard = {
        _id        : it._id,
        itemName   : it.itemName,
        brand      : it.brand?.brandName || null,
        unit       : it.unit?.unitName   || null,
        description: it.description,
        itemImages : it.itemImages,
        salesPrice : it.salesPrice,
        mrp        : it.mrp
      };

      if (it.itemGroup === "Variant") {
        (it.variants || []).forEach(v => {
          const stock = currentStockFor(it, maps, v);
          if (stock > 0) {
            pushItem(ssc, { ...baseCard, _id: v._id, currentStock: stock, salesPrice: v.salesPrice ?? it.salesPrice, mrp: v.mrp ?? it.mrp });
          }
        });
      } else {
        const stock = currentStockFor(it, maps);
        if (stock > 0) pushItem(ssc, { ...baseCard, currentStock: stock });
      }
    });

    const decks = [...deckMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: decks });
  } catch (err) {
    console.error("catalog.listSubSubDecks error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ───── 4. PAGED ITEMS FOR ONE SUB-SUB-CAT ───── */
/* GET /vps/api/catalog/:catId/subcategories/:subId/subsubcategories/:subSubId */
exports.listItems = async (req, res) => {
  const { catId, subId, subSubId } = req.params;
  if ([catId, subId, subSubId].some(bad)) return res.status(400).json({ message: "Invalid ids" });

  const page  = Math.max(parseInt(req.query.page  || "1", 10), 1);
  const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);
  const skip  = (page - 1) * limit;

  try {
    const restrictedIds = await getRestrictedWarehouseIds(req);
    if (!restrictedIds.length) return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });

    const items = await Item.find({ category: catId, subCategory: subId, subSubCategory: subSubId, isOnline: true, warehouse: { $in: restrictedIds } })
      .select("itemName salesPrice mrp itemImages openingStock itemGroup variants")
      .lean();

    const maps = await getMapsOnce(req);
    const rows = [];

    items.forEach(it => {
      if (it.itemGroup === "Variant") {
        (it.variants || []).forEach(v => {
          const stock = currentStockFor(it, maps, v);
          if (stock > 0) rows.push({
            _id        : v._id,
            itemName   : `${it.itemName} / ${v.variantId?.variantName || "Variant"}`,
            salesPrice : v.salesPrice,
            mrp        : v.mrp,
            itemImages : it.itemImages,
            currentStock: stock
          });
        });
      } else {
        const stock = currentStockFor(it, maps);
        if (stock > 0) rows.push({
          _id         : it._id,
          itemName    : it.itemName,
          salesPrice  : it.salesPrice,
          mrp         : it.mrp,
          itemImages  : it.itemImages,
          currentStock: stock
        });
      }
    });

    const total = rows.length;
    const paged = rows.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error("catalog.listItems error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
