const express = require("express");
const Country = require("../models/countryModel");
const State = require("../models/stateModel");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

/* COUNTRY ROUTES */

// CREATE a new Country
router.post("/countries", authMiddleware, hasPermission("Countries", "Add"), async (req, res) => {
  try {
    const { countryName, status } = req.body;
    const newCountry = new Country({ countryName, status });
    const savedCountry = await newCountry.save();
    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: savedCountry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all Countries
router.get("/countries", authMiddleware, hasPermission("Countries", "View"), async (req, res) => {
  try {
    const countries = await Country.find();
    res.status(200).json({ success: true, data: countries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET a single Country by ID
router.get("/countries/:id", authMiddleware, hasPermission("Countries", "View"), async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) return res.status(404).json({ success: false, message: "Country not found" });
    res.status(200).json({ success: true, data: country });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE a Country
router.put("/countries/:id", authMiddleware, hasPermission("Countries", "Edit"), async (req, res) => {
  try {
    const updatedCountry = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCountry) return res.status(404).json({ success: false, message: "Country not found" });
    res.status(200).json({ success: true, message: "Country updated successfully", data: updatedCountry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE a Country
router.delete("/countries/:id", authMiddleware, hasPermission("Countries", "Delete"), async (req, res) => {
  try {
    const deletedCountry = await Country.findByIdAndDelete(req.params.id);
    if (!deletedCountry) return res.status(404).json({ success: false, message: "Country not found" });
    res.status(200).json({ success: true, message: "Country deleted successfully", data: deletedCountry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* STATE ROUTES */

// CREATE a new State
router.post("/states", authMiddleware, hasPermission("States", "Add"), async (req, res) => {
  try {
    const { stateName, country, status } = req.body;
    const newState = new State({ stateName, country, status });
    const savedState = await newState.save();
    res.status(201).json({
      success: true,
      message: "State created successfully",
      data: savedState,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all States
router.get("/states", authMiddleware, hasPermission("States", "View"), async (req, res) => {
  try {
    const states = await State.find().populate("country", "countryName");
    res.status(200).json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET a single State by ID
router.get("/states/:id", authMiddleware, hasPermission("States", "View"), async (req, res) => {
  try {
    const state = await State.findById(req.params.id).populate("country", "countryName");
    if (!state) return res.status(404).json({ success: false, message: "State not found" });
    res.status(200).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE a State
router.put("/states/:id", authMiddleware, hasPermission("States", "Edit"), async (req, res) => {
  try {
    const updatedState = await State.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedState) return res.status(404).json({ success: false, message: "State not found" });
    res.status(200).json({ success: true, message: "State updated successfully", data: updatedState });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE a State
router.delete("/states/:id", authMiddleware, hasPermission("States", "Delete"), async (req, res) => {
  try {
    const deletedState = await State.findByIdAndDelete(req.params.id);
    if (!deletedState) return res.status(404).json({ success: false, message: "State not found" });
    res.status(200).json({ success: true, message: "State deleted successfully", data: deletedState });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
