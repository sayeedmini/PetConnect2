const Groomer = require("../models/Groomer"); // Import the Groomer model

// @desc    Get all groomers with optional filters
// @route   GET /api/groomers
// @access  Public
exports.getAllGroomers = async (req, res) => {
  try {
    const groomers = await Groomer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: groomers, count: groomers.length });
  } catch (error) {
    console.error("Error fetching groomers:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Search for groomers with optional filters for service and location
// @route   GET /api/groomers/search
exports.searchGroomers = async (req, res) => {
  try {
    const { service, lng, lat, maxDistance = 50000 } = req.query; // Extract search parameters from the URL query string
    let query = {}; // Initialize an empty query object

    // If a service is specified (e.g., "Full Grooming"), filter groomers who offer it
    if (service) {
      query.services = { $in: [service] }; // $in checks if the array contains the value
    }

    // If coordinates are provided, perform a geospatial proximity search
    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance), // Limit results to a specific radius (default 50km)
        },
      };
    }

    // Execute the query on the Groomer collection
    const groomers = await Groomer.find(query);
    // Send back the results as JSON
    res.status(200).json({ success: true, data: groomers, count: groomers.length });
  } catch (error) {
    console.error("Error searching groomers:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Retrieve the full profile of a single groomer by their unique ID
// @route   GET /api/groomers/:id
// @access  Public
exports.getGroomerById = async (req, res) => {
  try {
    const groomer = await Groomer.findById(req.params.id); // Search by ID
    if (!groomer) {
      // Return 404 if no groomer matches that ID
      return res.status(404).json({ success: false, error: "Groomer not found" });
    }
    // Return the groomer object
    res.status(200).json({ success: true, data: groomer });
  } catch (error) {
    console.error("Error fetching groomer:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Create a new groomer profile
// @route   POST /api/groomers
// @access  Public
exports.createGroomer = async (req, res) => {
  try {
    const { name, email, experience, services, pricing, address, coordinates } = req.body;

    // Validate required fields
    if (!name || !email || !experience) {
      return res.status(400).json({ success: false, error: "Name, email, and experience are required" });
    }

    // Check if groomer with this email already exists
    const existingGroomer = await Groomer.findOne({ email });
    if (existingGroomer) {
      return res.status(400).json({ success: false, error: "Groomer with this email already exists" });
    }

    // Create new groomer
    const groomer = await Groomer.create({
      name,
      email,
      experience,
      services: services || [],
      pricing: pricing || [],
      address: address || "",
      location: {
        type: "Point",
        coordinates: coordinates || [90.4086, 23.8103], // Default to Dhaka coordinates
      },
      rating: 5.0,
      reviewCount: 0,
      portfolioImages: [],
    });

    res.status(201).json({ success: true, data: groomer, message: "Groomer created successfully" });
  } catch (error) {
    console.error("Error creating groomer:", error);
    res.status(500).json({ success: false, error: error.message || "Server Error" });
  }
};

// @desc    Update an existing groomer profile
// @route   PUT /api/groomers/:id
// @access  Public
exports.updateGroomer = async (req, res) => {
  try {
    const { name, email, experience, services, pricing, address, coordinates, rating, reviewCount } = req.body;

    // Find the groomer by ID
    let groomer = await Groomer.findById(req.params.id);
    if (!groomer) {
      return res.status(404).json({ success: false, error: "Groomer not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== groomer.email) {
      const existingEmail = await Groomer.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: "This email is already in use" });
      }
    }

    // Update fields
    if (name) groomer.name = name;
    if (email) groomer.email = email;
    if (experience) groomer.experience = experience;
    if (services) groomer.services = services;
    if (pricing) groomer.pricing = pricing;
    if (address) groomer.address = address;
    if (rating) groomer.rating = rating;
    if (reviewCount) groomer.reviewCount = reviewCount;
    
    if (coordinates) {
      groomer.location = {
        type: "Point",
        coordinates: coordinates,
      };
    }

    groomer = await groomer.save();
    res.status(200).json({ success: true, data: groomer, message: "Groomer updated successfully" });
  } catch (error) {
    console.error("Error updating groomer:", error);
    res.status(500).json({ success: false, error: error.message || "Server Error" });
  }
};

// @desc    Delete a groomer profile
// @route   DELETE /api/groomers/:id
// @access  Public
exports.deleteGroomer = async (req, res) => {
  try {
    const groomer = await Groomer.findByIdAndDelete(req.params.id);
    
    if (!groomer) {
      return res.status(404).json({ success: false, error: "Groomer not found" });
    }

    res.status(200).json({ success: true, data: groomer, message: "Groomer deleted successfully" });
  } catch (error) {
    console.error("Error deleting groomer:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
