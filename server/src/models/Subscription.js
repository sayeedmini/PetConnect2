const mongoose = require("mongoose"); // MongoDB modeling tool

// Sub-schema for tracking automated reminders (SMS/Email) sent to the customer
const reminderSchema = new mongoose.Schema(
  {
    channel: { type: String, default: "SMS" }, // The delivery method (e.g., SMS)
    message: { type: String, required: true }, // The content of the notification
    sentAt: { type: Date, default: Date.now }, // Timestamp of when it was sent
    status: { type: String, default: "Sent" }, // Delivery status
  },
  { _id: false } // Prevents Mongoose from creating a separate ID for each reminder
);

// Main Schema for an active Customer-to-Groomer subscription
const subscriptionSchema = new mongoose.Schema(
  {
    groomerId: {
      type: mongoose.Schema.Types.ObjectId, // Link to the Groomer being subscribed to
      ref: "Groomer",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId, // Link to the specific Plan definition
      ref: "SubscriptionPlan",
      required: true,
    },
    subscriberName: { type: String, required: true }, // Customer's name
    subscriberPhone: { type: String, required: true }, // Customer's phone for SMS alerts
    subscriberEmail: { type: String }, // Optional contact email
    paymentMethod: { type: String, enum: ["Bkash", "COD"], required: true }, // bKash is the preferred digital payment
    bkashNumber: { type: String }, // The bKash number used for the transaction
    paymentReference: { type: String, required: true }, // Transaction ID from bKash
    paymentStatus: { type: String, default: "Paid" }, // Tracks if the current period is paid
    invoiceNumber: { type: String, required: true }, // Unique ID for accounting
    autoRenew: { type: Boolean, default: true }, // Whether to bill automatically next period
    status: { 
      type: String, 
      enum: ["Active", "Cancelled", "Paused"], 
      default: "Active" 
    },
    subscribedAt: { type: Date, default: Date.now }, // Initial signup date
    nextBillingDate: { type: Date, required: true }, // When the next payment is due
    reminders: [reminderSchema], // Array of all reminders sent for this subscription
  },
  { timestamps: true } // Auto-track creation and update times
);

// Export the Subscription model
module.exports = mongoose.model("Subscription", subscriptionSchema);
