// routes/terminalRoutes.js

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { authMiddleware, hasPermission } = require('../middleware/authMiddleware');
const {
  getTerminals,
  createTerminal,
  updateTerminal,
  deleteTerminal
} = require('../controllers/terminalController');

const storage = multer.diskStorage({
  destination: (_,__,cb) => cb(null, path.join(__dirname,'../uploads/qr')),
  filename:   (_,file,cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const router = express.Router();

router.get(
  '/terminals',
  authMiddleware,
  hasPermission('Terminals','View'),
  getTerminals
);

router.post(
  '/terminals',
  authMiddleware,
  hasPermission('Terminals','Add'),
  upload.single('qrCode'),
  createTerminal
);

router.put(
  '/terminals/:id',
  authMiddleware,
  hasPermission('Terminals','Edit'),
  upload.single('qrCode'),
  updateTerminal
);

router.delete(
  '/terminals/:id',
  authMiddleware,
  hasPermission('Terminals','Delete'),
  deleteTerminal
);

module.exports = router;
