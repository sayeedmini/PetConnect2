const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const router = express.Router();

router.post('/:userEmail/create', async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponDiscount = 0 } = req.body;
    const cart = await Cart.findOne({ user: req.params.userEmail }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.priceAtAdd,
    }));

    const subtotal = cart.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
    const discount = Math.min(Number(couponDiscount) || 0, subtotal);
    const total = Math.max(0, subtotal - discount);
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = new Order({
      orderId,
      user: req.params.userEmail,
      items: orderItems,
      subtotal,
      discount,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || 'bKash',
      status: 'Pending',
    });

    await order.save();
    cart.items = [];
    await cart.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:userEmail', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userEmail }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
