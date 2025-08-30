// routes/bookingRoutes.js
const router           = require('express').Router();
const commonAuth       = require('../middleware/commonAuth');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');
const ctrl             = require('../controllers/bookingController');

// Customer
router.use(commonAuth);
router.post('/bookings',    ctrl.createBooking);
router.get('/bookings/my',  ctrl.getMyBookings);



router.get(
  '/bookings/:id/details',
  authMiddleware,
  ctrl.getMyBookingDetails
);

// Store-admin
router.use(authMiddleware);
router.get(
  '/bookings/pending',
  hasPermission('Bookings','View'),
  ctrl.listPending
);
router.get('/bookings/my-completed-jobs'   , ctrl.listMyCompletedJobs);

router.patch( '/bookings/:id/assign',
             hasPermission('Bookings','Edit'),
             ctrl.assignBooking );

// Driver
router.get ('/bookings/assigned',   ctrl.listAssigned);
router.patch('/bookings/:id/claim',  ctrl.claimBooking);
router.get('/bookings/my-jobs', authMiddleware, ctrl.listMyJobs);

// (Optional) status updates
router.patch('/bookings/:id/status', ctrl.updateStatus);

module.exports = router;
