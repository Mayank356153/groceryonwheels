// middleware/commonAuth.js
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

module.exports = asyncHandler((req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  let payload;
  try {
    payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // payload should include at least `.id`
  // your customer-tokens currently do `jwt.sign({ id }, ...)`
  // your admin-tokens do `jwt.sign({ id, role }, ...)`
  req.userId   = payload.id;
  req.userRole = payload.role || "customer";
  next();
});
