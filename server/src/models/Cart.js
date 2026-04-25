const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  priceAtAdd: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.methods.getSubtotal = function getSubtotal() {
  return this.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
};

module.exports = mongoose.model('Cart', cartSchema);
