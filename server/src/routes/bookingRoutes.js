const express = require('express'); // Express framework
const router = express.Router(); // Router instance for booking endpoints
const { createBooking, updateStatus, getBookingById } = require('../controllers/bookingController'); // Controller imports

// Route: POST /api/bookings
// Creates a new appointment with the selected groomer and location
router.post('/', createBooking);

// Route: GET /api/bookings/:id
// Fetches the status and details of a single booking for the tracking page
router.get('/:id', getBookingById);

// Route: PUT /api/bookings/:id/status
// Updates the progress stage (e.g., 'Arrived') during the live simulation
router.put('/:id/status', updateStatus);

// Export router for use in server.js
module.exports = router;
