const express = require('express');
const { CatalogSubscriptionPlan, CatalogSubscription } = require('../models/CatalogSubscription');

const router = express.Router();

router.get('/plans', async (req, res) => {
  try {
    const plans = await CatalogSubscriptionPlan.find({ isActive: true });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { userEmail, planId, deliveryAddress, paymentMethod } = req.body;
    const plan = await CatalogSubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const endDate = new Date();
    if (plan.duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else if (plan.duration === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
    else if (plan.duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

    const nextBillingDate = new Date(endDate);
    const subscription = new CatalogSubscription({
      userEmail,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      nextBillingDate,
      deliveryAddress,
      paymentMethod,
    });

    await subscription.save();
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userEmail', async (req, res) => {
  try {
    const subscription = await CatalogSubscription.findOne({ userEmail: req.params.userEmail, status: 'active' }).populate('planId');
    if (!subscription) return res.json({ success: true, subscription: null, message: 'No active subscription' });
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const subscription = await CatalogSubscription.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
