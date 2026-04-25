const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
    },
    paymentMethod: { type: String, default: 'bKash' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
