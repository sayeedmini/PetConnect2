const express = require('express');

const router = express.Router();

router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupons = {
      SAVE10: { discount: 10, type: 'percentage', minAmount: 500 },
      SAVE20: { discount: 20, type: 'percentage', minAmount: 1000 },
      FLAT50: { discount: 50, type: 'fixed', minAmount: 0 },
    };

    const normalizedCode = String(code || '').trim().toUpperCase();
    const coupon = coupons[normalizedCode];
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const numericSubtotal = Number(subtotal) || 0;
    if (numericSubtotal < coupon.minAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount of ৳${coupon.minAmount} required` });
    }

    const discountAmount = coupon.type === 'percentage' ? (numericSubtotal * coupon.discount) / 100 : coupon.discount;
    res.json({ success: true, coupon: { code: normalizedCode, discount: coupon.discount, type: coupon.type, discountAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
