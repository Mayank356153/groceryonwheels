const mongoose = require('mongoose');

const marketingItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});


module.exports = mongoose.model('MarketingItem', marketingItemSchema);
