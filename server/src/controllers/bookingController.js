const Booking = require("../models/Booking"); // Import the Booking model

// @desc    Create a new grooming appointment
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    // Destructure required fields from the request body sent by the frontend
    const { groomerId, petOwnerName, date, time, coordinates, address } = req.body;

    // Create a new document in the Booking collection
    const booking = await Booking.create({
      groomerId,
      petOwnerName,
      date,
      time,
      serviceLocation: { 
        type: "Point", 
        coordinates, // [lng, lat]
        address
      },
      status: "Pending", // Initial status for all new bookings
    });

    // Return the newly created booking with a 201 (Created) status
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, error: error.message || "Server Error" });
  }
};

// @desc    Update the current status of a booking (e.g., from 'Accepted' to 'On the Way')
// @route   PUT /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // Extract new status from request
    // List of allowed status values to prevent invalid data
    const validStatuses = ["Pending", "Accepted", "On the Way", "Arrived", "Completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    // Find the booking by ID and update its status
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // Return the updated document instead of the old one
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Retrieve a specific booking and include the linked groomer's details
// @route   GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    // .populate('groomerId') replaces the ID with the actual groomer document fields
    const booking = await Booking.findById(req.params.id).populate("groomerId", "name email location address");

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
