// controllers/customerController.js
const asyncHandler = require("express-async-handler");
const Customer = require("../models/customerModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const {
  SMS_API_URL, SMS_USERNAME, SMS_PASSWORD, SMS_FROM, JWT_SECRET
} = process.env;

const generateToken = id => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /send-otp
 */
exports.sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return sendError(res, { status:400, message:"Phone is required" });

  let customer = await Customer.findOne({ phone });
  if (!customer) customer = new Customer({ phone });

  const otp = generateOTP();
  customer.otp = otp;
  customer.otpExpires = Date.now() + 10*60*1000;
  await customer.save();

  const name = customer.name || "Customer";
  const msg = `Dear ${name}, ${otp} is the OTP for your login at Grocery on Wheels. In case you have not requested this, please contact us at contact@inspiredgrow.in – INSPGD`;
  const smsUrl = `${SMS_API_URL}?username=${SMS_USERNAME}&password=${SMS_PASSWORD}`
    + `&from=${SMS_FROM}&to=${phone}&msg=${encodeURIComponent(msg)}&type=1&template_id=1707168662769323079`;

  await axios.get(smsUrl);

  sendSuccess(res, { status:200, message:"OTP sent successfully" });
});

/**
 * POST /verify-otp
 */
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return sendError(res, { status:400, message:"Phone and OTP are required" });

  const customer = await Customer.findOne({ phone });
  console.log("Customer found:", customer);
  if (!customer) return sendError(res, { status:404, message:"User not found" });
  if (!customer.otp || customer.otp !== otp || Date.now() > customer.otpExpires) {
    return sendError(res, { status:400, message:"Invalid or expired OTP" });
  }

  customer.otp = null;
  customer.otpExpires = null;
  await customer.save();

  if (customer.name) {
    const token = generateToken(customer._id);
    return sendSuccess(res, { status:200, message:"Logged in successfully", data:{ token } });
  } else {
    return sendSuccess(res, { status:200, message:"OTP verified; please complete your profile" });
  }
});

/**
 * POST /complete-profile
 */
exports.completeProfile = asyncHandler(async (req, res) => {
  const { phone, name, email, city, state, country } = req.body;
  if (!phone || !name) return sendError(res, { status:400, message:"Phone and Name are required" });

  const customer = await Customer.findOne({ phone });
  if (!customer) return sendError(res, { status:404, message:"User not found" });
  if (customer.name) return sendError(res, { status:400, message:"Profile already complete" });

  customer.name = name;
  if (email) customer.email = email;
  customer.city = city;
  customer.state = state;
  customer.country = country;
  await customer.save();

  const token = generateToken(customer._id);
  sendSuccess(res, { status:201, message:"Profile completed. You’re now logged in.", data:{ token } });
});

/**
 * GET /profile
 */
exports.getCustomerProfile = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.user);
  if (!customer) return sendError(res, { status:404, message:"Customer not found" });

  sendSuccess(res, {
    status:200,
    message:"Profile retrieved",
    data:{
      phone:customer.phone,
      name:customer.name,
      email:customer.email,
      city:customer.city,
      state:customer.state,
      country:customer.country,
      createdAt:customer.createdAt
    }
  });
});

exports.updateCustomerProfile = asyncHandler(async (req, res) => {
  // Only allow a controlled subset of fields:
  const allowed = ["name", "email", "city", "state", "country"];
  const updates = {};

  allowed.forEach(key => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (!Object.keys(updates).length) {
    return sendError(res, { status:400, message:"No valid fields supplied for update" });
  }

  const customer = await Customer.findByIdAndUpdate(
    req.user,                         // set in auth middleware
    { $set: updates },
    { new:true, runValidators:true }
  );

  if (!customer) return sendError(res, { status:404, message:"Customer not found" });

  sendSuccess(res, { status:200, message:"Profile updated successfully", data:customer });
});

exports.getAllAppCustomers = asyncHandler(async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    sendSuccess(res, {
      status: 200,
      message: "App customers retrieved successfully",
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching app customers:", error);
    sendError(res, { status: 500, message: "Server error", error: error.message });
  }
});




