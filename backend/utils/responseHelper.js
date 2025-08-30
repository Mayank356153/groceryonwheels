// utils/responseHelper.js
exports.sendSuccess = (res, { status = 200, message, data = null }) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

exports.sendError = (res, { status = 500, message }) => {
  return res.status(status).json({ success: false, message });
};
