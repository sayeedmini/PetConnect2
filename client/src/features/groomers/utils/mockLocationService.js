/**
 * mockLocationService.js
 * Handles address-to-coordinate conversion (Geocoding) and driving route generation.
 * Uses public APIs to avoid requiring proprietary keys (like Google Maps).
 */

// Hardcoded coordinate fallbacks for major areas in Dhaka
const LOCATIONS = {
  dhaka: [90.4125, 23.8103],
  gulshan: [90.4152, 23.8161],
  banani: [90.4066, 23.7937],
  uttara: [90.3881, 23.8724],
  dhanmondi: [90.3742, 23.7461],
};

/**
 * Converts a text address into [longitude, latitude] coordinates.
 * Uses OpenStreetMap's Nominatim API.
 */
export const geocode = async (address) => {
  if (!address) return LOCATIONS.dhaka; // Return default center if address is empty
  
  try {
    // We append "Dhaka, Bangladesh" to the query to improve search accuracy
    const query = encodeURIComponent(`${address}, Dhaka, Bangladesh`);
    
    // Fetch from Nominatim (OpenStreetMap's geocoding service)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "PetConnect-Demo-App" // Required by Nominatim Policy to identify the caller
      }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      console.log(`Nominatim found [${address}]:`, { lat, lon });
      return [parseFloat(lon), parseFloat(lat)]; // Returns coordinates as [lng, lat]
    }
  } catch (err) {
    console.error("Nominatim API lookup failed, using fallback:", err);
  }

  // Local fallback: If API fails, check if the address text mentions a common area
  const cleanAddress = address.toLowerCase();
  for (const key in LOCATIONS) {
    if (cleanAddress.includes(key)) return LOCATIONS[key];
  }
  
  return LOCATIONS.dhaka; // Final default if no match is found
};

/**
 * Generates a list of points representing a road-following path between two locations.
 * Uses the OSRM (Open Source Routing Machine) API.
 */
export const getLiveRoute = async (start, end) => {
  try {
    // Query OSRM with start and end coordinates
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      // OSRM returns coordinates in [lng, lat] format, 
      // but Leaflet (our map library) expects {lat, lng} objects.
      return data.routes[0].geometry.coordinates.map((coord) => ({
        lat: coord[1],
        lng: coord[0],
      }));
    }
  } catch (err) {
    console.error("OSRM Routing Error:", err);
  }
  
  // Minimal fallback: If routing fails, return a straight line between the two points
  return [
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng }
  ];
};
