// controllers/bookingController.js
const Address     = require('../models/addressModel');
const VanBooking  = require('../models/bookingModel');
const asyncHandler= require('express-async-handler');
const mongoose    = require('mongoose');
const User        = require('../models/userModel');
const PosOrder    = require('../models/PosOrder');

const WarehouseLocation = require('../models/warehouseLocationModel');

exports.createBooking = asyncHandler(async (req, res) => {
  const customer = req.userId;
  const { type, scheduledFor, remark, addressId } = req.body;

  // 1) figure out the pickupAddress:
  let addrDoc;
  if (addressId) {
    // use an existing saved address
          addrDoc = await Address.findOne({ _id:new mongoose.Types.ObjectId(addressId), user: customer });
    if (!addrDoc) return res.status(400).json({ message: 'Invalid addressId' });
  } else {
    // user typed a new address inline
    const {
      label='Booking Address',
      street, area='', city, state, country, postalCode
    } = req.body;
    if (!street||!city||!state||!country||!postalCode) {
      return res.status(400)
        .json({ message: 'street, city, state, country & postalCode are required when no addressId is given' });
    }
    addrDoc = await Address.create({
      user:       customer,
      label,
      street, area, city, state, country, postalCode
    });
  }

  // 2) validate schedule
  if (type==='scheduled' && !scheduledFor) {
    return res.status(400)
      .json({ message: 'scheduledFor is required for scheduled bookings' });
  }

  // 3) finally create the booking
  const booking = await VanBooking.create({
    customer,
    pickupAddress: addrDoc._id,         // now always set
    type,
    scheduledFor: type==='scheduled' 
                   ? new Date(scheduledFor) 
                   : undefined,
    remark
  });

  res.status(201).json({ success:true, data:booking });
});


exports.assignBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vanId } = req.body;
  if (!vanId) return res.status(400).json({ message: 'vanId required' });

  const booking = await VanBooking.findOneAndUpdate(
    { _id: id, status: 'pending' },
    {
      status:     'assigned',
      van:         vanId,
      assignedBy: req.userId,
      assignedAt: new Date()
    },
    { new: true }
  )
  .populate('customer','name phone')
  .populate('pickupAddress','street area city state postalCode location')
  .populate('van','name location');

  if (!booking) return res.status(409).json({ message: 'Already assigned or invalid' });
  res.json({ success:true, data:booking });
});

exports.claimBooking = asyncHandler(async (req, res) => {
  // 1) load the rider’s record
  const me = await User.findById(req.userId)
    .select('Defaultwarehouse WarehouseGroup')
    .lean();

  // build an array of allowed van IDs
  const allowedVans = [
    ...(me.Defaultwarehouse ? [me.Defaultwarehouse.toString()] : []),
    ...((me.WarehouseGroup || []).map(w => w.toString()))
  ];

  // 2) try to claim any booking that:
  //    • is currently 'assigned'
  //    • whose van is one of the rider’s allowed vans
  const booking = await VanBooking.findOneAndUpdate(
    { 
      _id:      req.params.id,
      status:   'assigned',
      van:      { $in: allowedVans }
    },
    { 
      status:     'accepted',
      acceptedBy: req.userId,
      acceptedAt: new Date()
    },
    { new: true }
  )
  .populate('van','name location')
  .populate('customer','name phone');

  if (!booking) {
    return res.status(409).json({
      message:
        'Already claimed, not assigned to your van, or invalid'
    });
  }

  res.json({ success: true, data: booking });
});



/**
 * 2) Employee fetches all pending requests
 */
exports.listPending = asyncHandler(async (_req, res) => {
  let list = await VanBooking.find({ status:'pending' })
    .populate('customer','name phone')
    .populate('pickupAddress','street area city state postalCode location')
    .populate('van','name location')   // once assigned
    .lean();

  // sort by scheduled time…
  // …

  res.json({ success:true, data: list });
});

exports.listAssigned = asyncHandler(async (req, res) => {
  const user = await User
    .findById(req.userId)
    .select('WarehouseGroup')
    .lean();

  const group = Array.isArray(user?.WarehouseGroup) 
    ? user.WarehouseGroup 
    : [];

  if (!group.length) {
    return res
      .status(400)
      .json({ message: 'You have no warehouses on your profile' });
  }

  const list = await VanBooking.find({
    status: 'assigned',
    van:    { $in: group }
  })
  .populate('customer','name phone')
  .populate('pickupAddress','street area city state country postalCode location')
  .lean();

  res.json({ success: true, data: list });
});



/**
 * 3) Employee claims a booking & assigns a van
 */
{/*exports.acceptBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const vanId     = req.body.vanId || req.user.warehouseId;

  const updated = await VanBooking.findOneAndUpdate(
    { _id: bookingId, status: 'pending' },
    {
      status:     'accepted',
      acceptedBy: req.userId,
      acceptedAt: new Date(),
      ...(vanId ? { van: vanId } : {})
    },
    { new: true }
  )
  .populate('customer', 'name phone')
  .populate('van', 'name location');

  if (!updated) {
    return res.status(409).json({ message: 'Booking already claimed or does not exist' });
  }
  res.json({ success: true, data: updated });
});
*/}
/**
 * 4) Customer polls their own bookings to see status & assigned van
 */

exports.getMyBookings = asyncHandler(async (req, res) => {
  const myId = req.userId;

  // 1) load all of this rider’s bookings
  const bookings = await VanBooking.find({ customer: myId })
    .populate('pickupAddress', 'street area city state country postalCode location')
    .populate('van', 'name') // just pull the van’s name for now
    .lean();

  // 2) collect all the van‐IDs (or warehouse‐IDs) you need locations for
  const vanIds = bookings
    .filter(b => b.van && b.van._id) // Ensure van exists before accessing _id
    .map(b => b.van._id)
    .filter(Boolean);

  // 3) fetch their latest coords
  const locs = await WarehouseLocation.find({
    warehouse: { $in: vanIds }
  })
    .select('warehouse coords')
    .lean();

  // 4) build a map from warehouseId → coords
  const coordsByVan = locs.reduce((m, l) => {
    m[l.warehouse.toString()] = l.coords;
    return m;
  }, {});

  // 5) attach the coords to each booking
  const enriched = bookings.map(b => ({
    ...b,
    vanLocation: b.van && b.van._id ? coordsByVan[b.van._id.toString()] || null : null
  }));

  res.json({ success: true, data: enriched });
});

/**
 * Optional: advance status (in_transit, completed, cancelled)
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!['in_transit','completed','cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  let update;

  if (status === 'cancelled') {
    // rider cancelled → make it assignable again
    update = {
      status:     'assigned',
      acceptedBy: null,
      acceptedAt: null,
      // (optionally keep booking.van so everyone on that van can claim)
    };
  } else {
    // normal transitions
    update = { status };
  }

  const updated = await VanBooking.findByIdAndUpdate(
    bookingId,
    update,
    { new: true }
  )
  .populate('customer','name phone')
  .populate('pickupAddress','street area city state country postalCode location')
  .lean();

  res.json({ success: true, data: updated });
});

exports.listMyJobs = asyncHandler(async (req, res) => {
  const list = await VanBooking.find({
    acceptedBy: req.userId,
    status:    { $in: ['accepted','in_transit'] }
  })
  .populate('customer','name phone')
  .populate('pickupAddress','street area city state country postalCode location')
  .lean();

  res.json({ success:true, data:list });
});
exports.listMyCompletedJobs = asyncHandler(async (req, res) => {
  // 1) get all completed bookings for this rider
  const bookings = await VanBooking.find({
    acceptedBy: req.userId,
    status:    'completed'
  })
  .populate('customer','name phone')
  .populate('pickupAddress','street area city state country postalCode location')
  .lean();

  // 2) fetch all POS orders whose `booking` field matches one of these IDs
  const orderDocs = await PosOrder.find({
    booking: { $in: bookings.map(b => b._id) }
  })
  // optionally populate the actual item name and paymentTypeName
  .populate('items.item','itemName')
  .populate('payments.paymentType','paymentTypeName')
  .lean();

  // 3) build a lookup map from bookingId → order
  const ordersByBooking = orderDocs.reduce((m, o) => {
    m[o.booking.toString()] = o;
    return m;
  }, {});

  // 4) attach the matching order (or null) to each booking
  const result = bookings.map(b => ({
    ...b,
    order: ordersByBooking[b._id.toString()] || null
  }));

  res.json({ success: true, data: result });
});

// controllers/bookingController.js
exports.getMyBookingDetails = asyncHandler(async (req, res) => {
  const customerId = req.userId;
  const { id }     = req.params;

  // 1) load the booking
  const booking = await VanBooking.findOne({
    _id:      id,
    customer: customerId
  })
  .populate('customer','name phone')
  .populate(
    'pickupAddress',
    'street area city state country postalCode'
  )
  .lean();

  if (!booking) {
    return res.status(404).json({ success:false, message:'Booking not found' });
  }

  // 2) load the matching POS order
  let order = await PosOrder.findOne({ booking: booking._id })
    .populate('items.item','itemName')
    .populate('payments.paymentType','paymentTypeName')
    .lean();

  // 3) if we found an order, build a slimmed‐down “summary” object
  let orderSummary = null;
  if (order) {
    orderSummary = {
      _id:           order._id,
      items:         order.items.map(i => ({
                       itemName: i.item.itemName,
                       quantity: i.quantity,
                       price:    i.price,
                       subtotal: i.subtotal
                     })),
      totalAmount:   order.totalAmount,
      totalDiscount: order.totalDiscount,
      balanceDue:    order.balanceDue,
      changeReturn:  order.changeReturn,
      payments:      order.payments.map(p => ({
                       paymentType: p.paymentType.paymentTypeName,
                       amount:      p.amount
                     }))
    };
  }

  // 4) return only booking + that slim order
  res.json({
    success: true,
    data: {
      booking,
      order: orderSummary
    }
  });
});
