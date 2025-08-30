// controllers/chatController.js
const asyncHandler = require("express-async-handler");
const Conversation = require("../models/conversationModel");
const Message      = require("../models/customermessageModel");

// 1. Start or get conversation
exports.startConversation = asyncHandler(async (req, res) => {
  const me = req.userId;
  const other = req.body.otherUserId;
  let conv = await Conversation.findOne({ participants:{ $all:[me,other] } });
  if (!conv) conv = await Conversation.create({ participants:[me,other] });
  res.json({ success:true, data:conv });
});

// 2. List conversations
// 2. List conversations
exports.listConversations = asyncHandler(async (req, res) => {
  const convs = await Conversation.find({ participants: req.userId })
    .sort({ updatedAt: -1 })
    .populate({
      path: 'participants',       // Field in your Conversation model
      select: 'name',              // Only return the 'name' field
      model: 'Customer'            // Use the Customer model
    });

  res.json({ success: true, data: convs });
});


// 3. Get messages
exports.getMessages = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const limit   = parseInt(req.query.limit)||50;
  const before  = req.query.before ? new Date(req.query.before) : new Date();
  const msgs = await Message.find({
      conversation: cid,
      createdAt: { $lt: before }
    })
    .sort({ createdAt:-1 })
    .limit(limit);
  res.json({ success:true, data:msgs.reverse() });
});

// 4. Send message
exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, body } = req.body;
  const msg = await Message.create({
    conversation: conversationId,
    sender:       req.userId,
    body
  });
  // optional: emit via WebSocket here
  res.status(201).json({ success:true, data:msg });
});

// 5. Mark one read
exports.markRead = asyncHandler(async (req, res) => {
  const mid = req.params.mid;
  await Message.findByIdAndUpdate(mid, { $addToSet:{ readBy:req.userId } });
  res.json({ success:true, message:"Marked read" });
});

// 6. Mark all in conv read
exports.markAllRead = asyncHandler(async (req, res) => {
  const cid = req.params.cid;
  await Message.updateMany(
    { conversation:cid, readBy:{ $ne:req.userId } },
    { $addToSet:{ readBy:req.userId } }
  );
  res.json({ success:true, message:"All marked read" });
});
