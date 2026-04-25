const mongoose = require("mongoose"); // Core Mongoose module

// Schema definition for Subscription Plans (offered by groomers to customers)
const subscriptionPlanSchema = new mongoose.Schema(
  {
    groomerId: {
      type: mongoose.Schema.Types.ObjectId, // Link to the specific Groomer providing this plan
      ref: "Groomer",
      required: true,
    },
    title: { type: String, required: true }, // Name of the plan, e.g., "Monthly Spa Membership"
    price: { type: Number, required: true }, // Cost of the plan in BDT
    billingCycle: { type: String, default: "Monthly" }, // e.g., Monthly, Quarterly, or Yearly
    description: { type: String, required: true }, // A detailed summary of what the plan offers
    benefits: [{ type: String }], // List of perks (e.g., ["Free delivery", "10% discount"])
    active: { type: Boolean, default: true }, // Whether the plan is currently available for purchase
  },
  { timestamps: true } // Auto-track creation and modification dates
);

// Register the model with Mongoose
module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
