const mongoose = require("mongoose"); // Import Mongoose to define the schema

// Define the blueprint for a Groomer document in MongoDB
const groomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // The professional name of the groomer or salon
    email: { type: String, required: true, unique: true }, // Contact email, used as a unique identifier
    experience: { type: String, required: true }, // e.g., "5 Years" or "Expert"
    rating: { type: Number, default: 4.9 }, // Average customer rating
    reviewCount: { type: Number, default: 128 }, // Total number of reviews received
    services: [{ type: String }], // Array of services offered (e.g., ["Bath", "Nail Trim"])
    pricing: [
      {
        packageName: String, // e.g., "Basic Grooming"
        price: Number, // Price in BDT
        description: String, // What's included in the package
      },
    ],
    portfolioImages: [{ type: String }], // URLs to photos of the groomer's work
    location: {
      // GeoJSON Point format for mapping
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    address: { type: String }, // Human-readable address string
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Index for geospatial queries (allows us to find groomers within a certain distance)
groomerSchema.index({ location: "2dsphere" });

// Export the model so it can be used in controllers
module.exports = mongoose.model("Groomer", groomerSchema);
