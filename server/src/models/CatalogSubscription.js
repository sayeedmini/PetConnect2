const mongoose = require('mongoose');

const catalogSubscriptionPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  duration: String,
  description: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
});

const catalogSubscriptionSchema = new mongoose.Schema({
  userEmail: String,
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogSubscriptionPlan' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  nextBillingDate: Date,
  deliveryAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
  },
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now },
});

const CatalogSubscriptionPlan = mongoose.model('CatalogSubscriptionPlan', catalogSubscriptionPlanSchema);
const CatalogSubscription = mongoose.model('CatalogSubscription', catalogSubscriptionSchema);

module.exports = { CatalogSubscriptionPlan, CatalogSubscription };
