import React, { useState, useCallback, useEffect } from "react"; // React hooks for state and lifecycle
import { useParams, useNavigate } from "react-router-dom"; // Navigation and route parameters
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"; // Leaflet map components
import L from "leaflet"; // Core Leaflet library for icons and bounds
import axios from "axios"; // HTTP client for API calls
import { MapPin, Lock, Unlock, CheckCircle, ArrowLeft, User, Calendar, Clock, Home } from "lucide-react"; // UI Icons
import { geocode } from "../utils/mockLocationService"; // Helper to convert address string to lat/lng coordinates

// API Base URL from environment variables
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Custom Leaflet icon for the Destination marker (styled with Tailwind-like CSS)
const destIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#0D9488,#14B8A6);color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 3px 8px rgba(13,148,136,0.4);">D</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/**
 * Component to handle clicking on the map to set a position
 */
const LocationPicker = ({ position, setPosition, isLocked }) => {
  useMapEvents({
    click(e) {
      // Only allow moving the pin if it's not locked
      if (!isLocked) setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  // Show marker at current position
  return position ? <Marker position={position} icon={destIcon} /> : null;
};

/**
 * Component to programmatically move the map view
 */
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => { 
    if (center) map.setView(center, 14); // Zoom to level 14 when center changes
  }, [center, map]);
  return null;
};

// Reusable Tailwind CSS class string for form inputs
const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all text-sm";

/**
 * Reusable wrapper for form fields with label and icon
 */
function FormField({ icon, label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        <span className="text-slate-400">{icon}</span>
        {label}
        {required && <span style={{ color: "#0D9488" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const BookingForm = () => {
  const { groomerId } = useParams(); // Get groomer ID from URL
  const navigate = useNavigate(); // Navigation function
  const [groomer, setGroomer] = useState(null); // Data for the selected groomer
  const [form, setForm] = useState({ petOwnerName: "", date: "", time: "", address: "", service: "" }); // Form fields state
  const [selectedCoords, setSelectedCoords] = useState([23.8103, 90.4125]); // Coordinates for the map marker
  const [isLocked, setIsLocked] = useState(false); // Whether the location pin is confirmed/locked
  const [loading, setLoading] = useState(false); // Submission loading state
  const [booked, setBooked] = useState(false); // Whether booking was successful
  const [bookingId, setBookingId] = useState(null); // ID of the created booking

  // Fetch groomer info on load
  useEffect(() => {
    if (!groomerId) return;
    axios.get(`${API}/api/groomers/${groomerId}`)
      .then(({ data }) => setGroomer(data.data))
      .catch(console.error);
  }, [groomerId]);

  // Handle address input losing focus: try to auto-locate on map
  const handleAddressBlur = async () => {
    if (form.address.trim() && !isLocked) {
      try {
        const coords = await geocode(form.address); // Convert address text to lat/lng
        setSelectedCoords([coords[1], coords[0]]); // Update map position
      } catch (err) { console.error("Auto-locate failed:", err); }
    }
  };

  // Submit the booking to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation: must lock location before booking
    if (!isLocked) { alert("Please confirm your location on the map before booking."); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/bookings`, {
        groomerId,
        petOwnerName: form.petOwnerName,
        date: form.date,
        time: form.time,
        coordinates: [selectedCoords[1], selectedCoords[0]], // [lng, lat] for GeoJSON
        address: form.address,
        service: form.service
      });
      setBookingId(data.data._id); // Store new booking ID
      setBooked(true); // Switch to success view
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  // Helper for form validation
  const isFormValid = form.petOwnerName && form.date && form.time && form.address && isLocked;

  // Success View: shown after booking is confirmed
  if (booked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16 px-4">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#CCFBF1" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "#0D9488" }} />
          </div>
          <h2 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.5rem" }}>Booking Confirmed!</h2>
          <p className="text-slate-500 mb-2 text-sm">Your appointment with <strong>{groomer?.name || "your groomer"}</strong> has been scheduled.</p>
          <div className="bg-slate-50 rounded-xl p-4 mt-5 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><User className="w-4 h-4 text-slate-400" /><span>{form.petOwnerName}</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="w-4 h-4 text-slate-400" /><span>{form.date} at {form.time}</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4 text-slate-400" /><span>{form.address}</span></div>
          </div>
          <div className="flex gap-3">
            {/* Primary Action: Go to Tracking Page */}
            <button onClick={() => navigate(`/grooming/track/${bookingId}`)} className="flex-1 py-3 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(135deg,#0D9488,#14B8A6)" }}>Track Groomer</button>
            <button onClick={() => navigate("/groomers")} className="flex-1 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">Back Home</button>
          </div>
        </div>
      </div>
    );
  }

  // Primary Booking Form View
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Sub-header with back button */}
      <div className="border-b border-slate-100 bg-white px-4 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(groomerId ? `/groomers/${groomerId}` : "/groomers")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.15rem" }}>Book Home Grooming</h1>
            <p className="text-slate-500 text-sm">{groomer ? `with ${groomer.name} · ${groomer.address || ""}` : "Schedule your appointment"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form Inputs */}
          <div className="space-y-6">
            {/* Personal Details Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-slate-900 mb-5" style={{ fontWeight: 700, fontSize: "1.05rem" }}>Your Details</h2>
              <div className="space-y-4">
                <FormField icon={<User className="w-4 h-4" />} label="Your Name" required>
                  <input type="text" placeholder="e.g. Sakib Al Hasan" value={form.petOwnerName} onChange={(e) => setForm({ ...form, petOwnerName: e.target.value })} className={inputClass} />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField icon={<Calendar className="w-4 h-4" />} label="Date" required>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
                  </FormField>
                  <FormField icon={<Clock className="w-4 h-4" />} label="Time" required>
                    <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} />
                  </FormField>
                </div>
                {/* Service Selection Dropdown */}
                {groomer?.services?.length > 0 && (
                  <FormField icon={<Home className="w-4 h-4" />} label="Service">
                    <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={inputClass}>
                      <option value="">Select a service</option>
                      <option value="All Services">All Services</option>
                      {groomer.services.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>
                )}
              </div>
            </div>

            {/* Location Confirmation Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-slate-900 mb-1" style={{ fontWeight: 700, fontSize: "1.05rem" }}>Service Location</h2>
              <p className="text-slate-400 text-xs mb-4">Type your area below, then fix your pin on the map.</p>
              <FormField icon={<MapPin className="w-4 h-4" />} label="Address" required>
                <input type="text" placeholder="e.g. Road 5, Block D, Bashundhara R/A" value={form.address} disabled={isLocked} onChange={(e) => setForm({ ...form, address: e.target.value })} onBlur={handleAddressBlur} className={inputClass} />
              </FormField>
              {/* Lock/Unlock Toggle Button */}
              <button type="button" onClick={() => setIsLocked(!isLocked)} className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={isLocked ? { background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" } : { background: "linear-gradient(135deg,#0D9488,#14B8A6)", color: "white" }}>
                {isLocked ? <><Unlock className="w-4 h-4" /> Unlock to Edit Pin</> : <><Lock className="w-4 h-4" /> Confirm Pin Location</>}
              </button>
              {isLocked && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: "#0D9488" }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Location confirmed — {form.address || "Pin placed on map"}
                </div>
              )}
            </div>

            {/* Main Submit Button */}
            <button onClick={handleSubmit} disabled={!isFormValid || loading} className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95"
              style={isFormValid && !loading ? { background: "linear-gradient(135deg,#0D9488,#14B8A6)", boxShadow: "0 8px 25px rgba(13,148,136,0.3)" } : { background: "#CBD5E1", cursor: "not-allowed" }}>
              {loading ? "Confirming..." : isFormValid ? "Confirm Booking" : "Confirm Location to Proceed"}
            </button>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100" style={{ height: "520px" }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: "#0D9488" }} />
                  <span className="text-slate-700 text-sm font-semibold">Location Map</span>
                </div>
                {isLocked && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#CCFBF1", color: "#0F766E" }}>📍 Pin Locked</span>}
              </div>
              <div style={{ height: "calc(100% - 52px)" }}>
                {/* Leaflet Map Component */}
                <MapContainer center={selectedCoords} zoom={14} scrollWheelZoom={!isLocked} style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ChangeView center={selectedCoords} />
                  <LocationPicker position={selectedCoords} setPosition={setSelectedCoords} isLocked={isLocked} />
                </MapContainer>
              </div>
            </div>
            <p className="text-slate-400 text-xs text-center">Click on the map to move your pin, then confirm to lock it.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
