const express       = require("express");
const listEndpoints = require("express-list-endpoints"); // ← import the function
const router        = express.Router();

const axios = require("axios");

const ORS_API_KEY ="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1NjQyZmFhMjVlNjQ1ZjE5YzFjMzc5ZDFhMWIyMDAxIiwiaCI6Im11cm11cjY0In0="; // Add to your .env

router.get("/", async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) return res.status(400).json({ error: "Missing start or end" });

  try {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const response = await axios.get(url, {
      params: {
        api_key: ORS_API_KEY,
        start,
        end,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("ORS proxy error:", err?.response?.data || err.message);
    res.status(500).json({ error: "ORS request failed" });
  }
});

module.exports = router;
