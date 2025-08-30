
// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
// const { createBooking, getBookings, updateBooking } = require('../controllers/deliverySlotController');
const { createSlot ,deleteSlot,getAllSlots } = require('../controllers/deliverySlotController');

router.post('/booking-slot', createSlot);
router.get('/all-slot', getAllSlots);
router.put('/:id',deleteSlot);

module.exports = router;

