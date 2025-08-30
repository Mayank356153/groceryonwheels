const router = require("express").Router();
const {
  createRequest, listRequests,
  approveRequest, rejectRequest
} = require("../controllers/deletionRequestController");

const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(authMiddleware, createRequest)        // any logged-in user
  .get(authMiddleware, isAdmin, listRequests); // admins list all

router.put("/:id/approve", authMiddleware, isAdmin, approveRequest);
router.put("/:id/reject",  authMiddleware, isAdmin, rejectRequest);

module.exports = router;
