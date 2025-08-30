const router = require("express").Router();
const ctl    = require("../controllers/catalogController");

// 1. strip of categories on home
router.get("/categories", ctl.listCategories);

// 2. sub-category mini-cards inside a category section
router.get("/categories/:catId/subcategories", ctl.listSubCategories);

// 3. full ‘Tomato page’  → decks = every sub-sub-cat + ALL of its items
router.get("/categories/:catId/subcategories/:subId/decks",
           ctl.listSubSubDecks);

// 4. optional deep pagination per sub-sub-category
router.get("/categories/:catId/subcategories/:subId/subsubcategories/:subSubId",
           ctl.listItems);

module.exports = router;
