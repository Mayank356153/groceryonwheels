// routes/listEndpoints.js
const express       = require("express");
const listEndpoints = require("express-list-endpoints"); // ← import the function
const router        = express.Router();

router.get("/all-endpoints", (req, res) => {
  // now listEndpoints is defined
  const endpoints = listEndpoints(req.app);
  const simple = endpoints.map(e => ({
    path:    e.path,
    methods: e.methods.join(", ")
  }));
  res.json({ success: true, endpoints: simple });
});

module.exports = router;
