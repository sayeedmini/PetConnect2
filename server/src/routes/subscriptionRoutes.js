const express = require("express"); // Express framework
const router = express.Router(); // Router instance for subscription-related endpoints
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  subscribe,
  toggleAutoRenew,
  cancelSubscription,
  generateInvoice,
  sendReminder,
} = require("../controllers/subscriptionController"); // Import all controller functions

// --- Plan Management Routes (For Groomers) ---

// Route: GET /api/subscriptions/plans - Fetch all defined subscription plans
router.get("/plans", getPlans);

// Route: POST /api/subscriptions/plans - Create a new plan tier
router.post("/plans", createPlan);

// Route: GET /api/subscriptions/plans/:id - Fetch a specific plan by ID
router.get("/plans/:id", getPlanById);

// Route: PUT /api/subscriptions/plans/:id - Edit an existing plan
router.put("/plans/:id", updatePlan);

// Route: DELETE /api/subscriptions/plans/:id - Remove a plan tier
router.delete("/plans/:id", deletePlan);

// --- User Subscription Routes (For Customers) ---

// Route: GET /api/subscriptions - List active memberships
router.get("/", getSubscriptions);

// Route: POST /api/subscriptions/subscribe - Purchase a new subscription (Checkout)
router.post("/subscribe", subscribe);

// Route: PUT /api/subscriptions/:id/auto-renew - Enable or disable recurring billing
router.put("/:id/auto-renew", toggleAutoRenew);

// Route: DELETE /api/subscriptions/:id - End a subscription
router.put("/:id/cancel", cancelSubscription);
router.delete("/:id", cancelSubscription);

// Route: GET /api/subscriptions/:id/invoice - View billing details for a specific period
router.get("/:id/invoice", generateInvoice);

// Route: POST /api/subscriptions/:id/reminder - Trigger a mock SMS notification
router.post("/:id/reminder", sendReminder);

// Export for server.js
module.exports = router;
