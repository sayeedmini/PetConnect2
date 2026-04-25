const Groomer = require("../models/Groomer"); // Groomer model
const SubscriptionPlan = require("../models/SubscriptionPlan"); // Plan definitions
const Subscription = require("../models/Subscription"); // Active subscriber records

/**
 * Helper: Generates a unique invoice number using current timestamp and random digits
 */
const buildInvoiceNumber = () => {
  const suffix = Math.floor(Math.random() * 90000 + 10000);
  return `INV-${Date.now()}-${suffix}`;
};

/**
 * Helper: Adds a specific number of months to a given date
 */
const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

/**
 * Helper: Creates a mock payment transaction reference (e.g., BKASH-123456)
 */
const mockPaymentReference = (provider) => {
  const prefix = provider.replace(/\s+/g, "").toUpperCase().slice(0, 8) || "DEMO";
  return `${prefix}-${Math.floor(Math.random() * 900000 + 100000)}`;
};

// @desc    Get all available subscription plans, optionally filtered by groomer
// @route   GET /api/subscriptions/plans
exports.getPlans = async (req, res) => {
  try {
    const query = req.query.groomerId ? { groomerId: req.query.groomerId, active: true } : { active: true };
    const plans = await SubscriptionPlan.find(query).populate("groomerId", "name address"); // Join with Groomer data
    res.status(200).json({ success: true, data: plans, count: plans.length });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Get a specific subscription plan by ID
// @route   GET /api/subscriptions/plans/:id
exports.getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id).populate("groomerId", "name address email rating reviewCount");
    
    if (!plan) {
      return res.status(404).json({ success: false, error: "Subscription plan not found" });
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Groomers use this to create new subscription tiers
// @route   POST /api/subscriptions/plans
exports.createPlan = async (req, res) => {
  try {
    const { groomerId, title, price, billingCycle = "Monthly", description, benefits = [] } = req.body;

    const groomer = await Groomer.findById(groomerId);
    if (!groomer) {
      return res.status(404).json({ success: false, error: "Groomer not found" });
    }

    const plan = await SubscriptionPlan.create({
      groomerId,
      title,
      price,
      billingCycle,
      description,
      benefits,
      active: true,
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Update details of an existing plan
// @route   PUT /api/subscriptions/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const { title, price, billingCycle, description, benefits } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Subscription plan not found" });
    }

    // Apply updates selectively if they are provided in the request body
    if (title !== undefined) plan.title = title;
    if (price !== undefined) plan.price = Number(price);
    if (billingCycle !== undefined) plan.billingCycle = billingCycle;
    if (description !== undefined) plan.description = description;
    if (benefits !== undefined) plan.benefits = benefits;

    await plan.save(); // Save changes to DB

    res.status(200).json({ success: true, data: plan, message: "Plan updated successfully." });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Deactivate/Delete a plan
// @route   DELETE /api/subscriptions/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, error: "Subscription plan not found" });
    }

    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Plan deleted successfully." });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    List active subscriptions (for either a groomer or a specific customer)
// @route   GET /api/subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const query = {};
    if (req.query.groomerId) query.groomerId = req.query.groomerId;
    if (req.query.subscriberPhone) query.subscriberPhone = req.query.subscriberPhone;

    const subscriptions = await Subscription.find(query)
      .populate("groomerId", "name address") // Join groomer name
      .populate("planId", "title price billingCycle description benefits"); // Join plan details

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

/**
 * Core Logic: Handles the checkout process when a user buys a subscription
 * @route   POST /api/subscriptions/subscribe
 */
exports.subscribe = async (req, res) => {
  try {
    const {
      groomerId,
      planId,
      subscriberName,
      subscriberPhone,
      subscriberEmail,
      paymentMethod,
      bkashNumber,
      autoRenew = true,
    } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Subscription plan not found" });
    }

    // Validation for payment methods (bKash or Cash on Delivery)
    if (!["Bkash", "COD"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: "Payment must be Bkash or COD" });
    }

    if (paymentMethod === "Bkash" && !bkashNumber) {
      return res.status(400).json({ success: false, error: "Bkash number is required for Bkash payment" });
    }

    // Force auto-renew to false for COD, enable for digital payments
    const normalizedAutoRenew = paymentMethod === "COD" ? false : Boolean(autoRenew);

    // Generate transaction details
    const invoiceNumber = buildInvoiceNumber();
    const paymentReference = mockPaymentReference(paymentMethod);
    const subscribedAt = new Date();
    const nextBillingDate = addMonths(subscribedAt, 1); // Set next renewal for 1 month later

    // Create the active subscription record
    const subscription = await Subscription.create({
      groomerId,
      planId,
      subscriberName,
      subscriberPhone,
      subscriberEmail,
      paymentMethod,
      bkashNumber,
      paymentReference,
      paymentStatus: "Paid",
      invoiceNumber,
      autoRenew: normalizedAutoRenew,
      status: "Active",
      subscribedAt,
      nextBillingDate,
      reminders: [
        {
          channel: "SMS",
          message: `Subscription activated for ${plan.title}. Next billing date is ${nextBillingDate.toDateString()}.`,
          status: "Sent",
          sentAt: new Date(),
        },
      ],
    });

    // Populate data for the response
    const populated = await Subscription.findById(subscription._id)
      .populate("groomerId", "name address")
      .populate("planId", "title price billingCycle description benefits");

    res.status(201).json({
      success: true,
      data: populated,
      message: `Payment confirmed through ${paymentMethod}. Subscription is active.`,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Customer can enable/disable auto-renew from their dashboard
// @route   PUT /api/subscriptions/:id/auto-renew
exports.toggleAutoRenew = async (req, res) => {
  try {
    const { autoRenew } = req.body;
    const target = await Subscription.findById(req.params.id);

    if (!target) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    // Business Logic: Don't allow auto-renew for COD as it requires manual visit
    if (target.paymentMethod === "COD" && Boolean(autoRenew)) {
      return res.status(400).json({ success: false, error: "COD subscriptions cannot enable auto-renew." });
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { autoRenew: Boolean(autoRenew) },
      { new: true }
    )
      .populate("groomerId", "name address")
      .populate("planId", "title price billingCycle description benefits");

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error updating auto renew:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    End a subscription immediately
// @route   DELETE /api/subscriptions/:id
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    res.status(200).json({
      success: true,
      data: { id: req.params.id },
      message: "Subscription removed successfully.",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Generate a JSON invoice for display on the frontend
// @route   GET /api/subscriptions/:id/invoice
exports.generateInvoice = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("groomerId", "name address")
      .populate("planId", "title price billingCycle description benefits");

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    // Construct a clean object with only necessary billing info
    const invoice = {
      invoiceNumber: subscription.invoiceNumber,
      customerName: subscription.subscriberName,
      customerPhone: subscription.subscriberPhone,
      payment: subscription.paymentMethod,
      amount: subscription.planId.price,
      planTitle: subscription.planId.title,
      billingCycle: subscription.planId.billingCycle,
      subscribedAt: subscription.subscribedAt,
      nextBillingDate: subscription.nextBillingDate,
      status: subscription.status,
      groomerName: subscription.groomerId?.name,
    };

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Simulate sending an SMS reminder for the upcoming billing cycle
// @route   POST /api/subscriptions/:id/remind
exports.sendReminder = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("groomerId", "name address")
      .populate("planId", "title price billingCycle description benefits");

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    // Build the dynamic message
    const message = `Reminder: ${subscription.planId.title} renews on ${subscription.nextBillingDate.toDateString()}. Auto-renew is ${subscription.autoRenew ? "enabled" : "disabled"}.`;

    // Add this reminder to the subscription's history array
    subscription.reminders.push({
      channel: "SMS",
      message,
      status: "Sent",
      sentAt: new Date(),
    });

    await subscription.save(); // Save the new reminder to the document

    res.status(200).json({
      success: true,
      data: subscription,
      message: "SMS reminder sent successfully.",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
