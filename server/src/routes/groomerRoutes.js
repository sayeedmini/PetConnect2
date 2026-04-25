const express = require("express"); // Core Express module
const router = express.Router(); // Create a new router instance for groomer-related paths
const { 
  getAllGroomers,
  searchGroomers, 
  getGroomerById,
  createGroomer,
  updateGroomer,
  deleteGroomer
} = require("../controllers/groomerController"); // Import controller logic

// Route: GET /api/groomers - Get all groomers
router.get("/", getAllGroomers);

// Route: GET /api/groomers/search - Search and filter groomers by service or location
router.get("/search", searchGroomers);

// Route: POST /api/groomers - Create a new groomer
router.post("/", createGroomer);

// Route: GET /api/groomers/:id - Fetch full details for a specific groomer using their ID
router.get("/:id", getGroomerById);

// Route: PUT /api/groomers/:id - Update a groomer profile
router.put("/:id", updateGroomer);

// Route: DELETE /api/groomers/:id - Delete a groomer profile
router.delete("/:id", deleteGroomer);

// Export the router to be used in server.js
module.exports = router;
