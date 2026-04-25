const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

router.get('/:userEmail', async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.params.userEmail }).populate('items.product');
    if (!cart) {
      cart = new Cart({ user: req.params.userEmail, items: [] });
      await cart.save();
    }

    const subtotal = cart.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
    res.json({ success: true, cart, subtotal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:userEmail/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock <= 0) return res.status(400).json({ success: false, message: 'Product is out of stock' });

    let cart = await Cart.findOne({ user: req.params.userEmail });
    if (!cart) cart = new Cart({ user: req.params.userEmail, items: [] });

    const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) existingItem.quantity += quantity;
    else cart.items.push({ product: productId, quantity, priceAtAdd: discountedPrice });

    await cart.save();
    await cart.populate('items.product');

    const subtotal = cart.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
    res.json({ success: true, cart, subtotal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:userEmail/remove/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userEmail });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();

    const subtotal = cart.items.reduce((total, item) => total + item.priceAtAdd * item.quantity, 0);
    res.json({ success: true, cart, subtotal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:userEmail/update/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.params.userEmail });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find((cartItem) => cartItem._id.toString() === req.params.itemId);
    if (item) {
      item.quantity = Math.max(1, Number(quantity) || 1);
      await cart.save();
    }

    const subtotal = cart.items.reduce((total, cartItem) => total + cartItem.priceAtAdd * cartItem.quantity, 0);
    res.json({ success: true, cart, subtotal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
