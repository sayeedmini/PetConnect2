const mongoose = require("mongoose"); // MongoDB modeling library

// Define the structure for a service booking (appointment)
const bookingSchema = new mongoose.Schema(
  {
    groomerId: {
      type: mongoose.Schema.Types.ObjectId, // Foreign key linking to the Groomer collection
      ref: "Groomer", // Specifies that the ID belongs to a Groomer document
      required: true,
    },
    petOwnerName: { type: String, required: true }, // Name of the customer who booked the service
    date: { type: Date, required: true }, // The scheduled date for grooming
    time: { type: String, required: true }, // The scheduled time for grooming
    serviceLocation: {
      // The customer's location where grooming will take place
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude] for the map pin
      address: { type: String }, // Human-readable address entered by the user
    },
    status: {
      // Current stage of the booking lifecycle
      type: String,
      enum: ["Pending", "Accepted", "On the Way", "Arrived", "Completed"],
      default: "Pending", // New bookings start as Pending
    },
  },
  { timestamps: true } // Captures creation time (booked at) and update time
);

// Allow searching and tracking based on service location coordinates
bookingSchema.index({ serviceLocation: "2dsphere" });

// Export the Booking model
module.exports = mongoose.model("Booking", bookingSchema);
