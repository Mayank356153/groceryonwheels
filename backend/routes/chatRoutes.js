// routes/chatRoutes.js
const router     = require("express").Router();
const commonAuth = require("../middleware/commonAuth");
const chat       = require("../controllers/chatController");

// everyone (customer, employee, admin) calls the same endpoints
router.use(commonAuth);

router.post   ("/conversations",                chat.startConversation);
router.get    ("/conversations",                chat.listConversations);
router.get    ("/conversations/:cid/messages",  chat.getMessages);
router.post   ("/messages",                     chat.sendMessage);
router.patch  ("/messages/:mid/read",           chat.markRead);
router.patch  ("/conversations/:cid/readAll",   chat.markAllRead);

module.exports = router;
