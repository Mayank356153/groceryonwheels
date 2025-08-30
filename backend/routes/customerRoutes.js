const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP,
  completeProfile,
  getCustomerProfile,
  getAllAppCustomers,
  updateCustomerProfile
} = require("../controllers/customerController");

// Suppose you have a "protect" middleware for JWT
const { protect } = require("../middleware/customerauthMiddleware");

/** 
 * 1) Send OTP to phone
 *    Expects { phone }
 */
router.post("/send-otp", sendOTP);

/**
 * 2) Verify OTP
 *    Expects { phone, otp }
 */
router.post("/verify-otp", verifyOTP);

/**
 * 3) Complete Profile (for brand-new user)
 *    Expects { phone, name, email, city, state, country }
 */
router.post("/create-account", completeProfile);

/**
 * 4) Protected route to get user details
 *    Expects Authorization: Bearer <token>
 */
router.get("/customers", protect, getAllAppCustomers);

router.get("/profile", protect, getCustomerProfile);
router.patch("/profile", protect, updateCustomerProfile); 

module.exports = router;