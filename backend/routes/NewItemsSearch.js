const express = require("express");
const router = express.Router();
const pool = require("../sql");

router.get("/", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query param ?q=" });
  }

  try {
    // multiple columns search (ItemCode = exact, Barcodes = exact, ItemName = LIKE)
    const sql = `
      SELECT *
      FROM items
      WHERE ItemCode = ?
         OR Barcodes = ?
         OR ItemName LIKE ?
         OR CategoryName LIKE ?
         OR BrandName LIKE ?
      LIMIT 20
    `;

    const searchLike = `%${q}%`;

    const [rows] = await pool.query(sql, [
      q,        // ItemCode exact
      q,        // Barcode exact
      searchLike, // ItemName LIKE
      searchLike, // CategoryName LIKE
      searchLike  // BrandName LIKE
    ]);


    if (rows.length > 0) {
      res.json({ found: true, count: rows.length, items: rows });
    } else {
      res.status(404).json({ found: false, items:[] });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
