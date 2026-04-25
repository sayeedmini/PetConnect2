import React, { useState, useEffect, useRef } from "react"; // React hooks for state, lifecycle, and references
import { useParams, useNavigate } from "react-router-dom"; // Route parameters and navigation
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"; // Leaflet map components
import L from "leaflet"; // Leaflet core for icons and coordinate logic
import { io } from "socket.io-client"; // Socket.io client for real-time communication
import axios from "axios"; // HTTP client for API requests
import { Navigation, ArrowLeft, MapPin, Clock, ChevronRight, Zap } from "lucide-react"; // UI Icons
import { getLiveRoute } from "../utils/mockLocationService"; // Helper to get coordinates for the route between two points

// API Base URL
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Configuration for different booking statuses (labels, colors, and descriptions)
const statusConfig = {
  Pending:     { label: "Pending",     color: "#64748B", bg: "#F1F5F9", desc: "Waiting for groomer to accept" },
  Accepted:    { label: "Accepted",    color: "#0D9488", bg: "#CCFBF1", desc: "Groomer accepted your request" },
  "On the Way":{ label: "On the Way", color: "#2563EB", bg: "#DBEAFE", desc: "Groomer is heading to your location" },
  Arrived:     { label: "Arrived",     color: "#7C3AED", bg: "#EDE9FE", desc: "Groomer has arrived at your door" },
  Completed:   { label: "Completed",   color: "#059669", bg: "#D1FAE5", desc: "Grooming session complete" },
};

// Array of statuses in logical order
const trackingStatuses = ["Pending", "Accepted", "On the Way", "Arrived", "Completed"];

/**
 * Utility to create a custom HTML-based marker icon for the map
 */
const createCustomIcon = (label, color) =>
  L.divIcon({
    html: `<div style="background:${color};color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);">${label}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

// Pre-defined icons for Destination (D) and Groomer (G)
const destIcon = createCustomIcon("D", "#0D9488");
const groomerIcon = createCustomIcon("G", "#2563EB");

/**
 * Component to automatically zoom the map to fit all provided coordinate points
 */
const MapBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    // Filter out invalid coordinates to prevent crashes
    const validPoints = points.filter(p => p && p[0] !== undefined && p[1] !== undefined);
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints); // Create a bounding box from points
      map.fitBounds(bounds, { padding: [50, 50] }); // Fit map to that box with some padding
    }
  }, [points, map]);
  return null;
};

/**
 * Component to programmatically move the map center
 */
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom()); // Re-center map without changing zoom
  }, [center, map]);
  return null;
};

const LiveTracking = () => {
  const { bookingId } = useParams(); // Get booking ID from URL
  const navigate = useNavigate(); // Navigation function
  const [booking, setBooking] = useState(null); // Data for the current booking
  const [groomerPos, setGroomerPos] = useState(null); // Live coordinates of the groomer
  const [destPos, setDestPos] = useState([23.8103, 90.4125]); // Coordinates of the destination (customer)
  const [routePath, setRoutePath] = useState([]); // List of coordinates representing the driving path
  const [currentStep, setCurrentStep] = useState(0); // Current index in the routePath (for simulation)
  const [etaMinutes, setEtaMinutes] = useState(null); // Calculated minutes until arrival
  const socketRef = useRef(null); // Reference to the socket connection

  // Derived state for status styling and progress
  const currentStatus = booking?.status || "Pending";
  const config = statusConfig[currentStatus] || statusConfig["Pending"];
  const statusIndex = trackingStatuses.indexOf(currentStatus);

  // Initialize data and socket connection on mount
  useEffect(() => {
    socketRef.current = io(API); // Connect to Socket.io server

    const fetchBooking = async () => {
      try {
        const { data } = await axios.get(`${API}/api/bookings/${bookingId}`); // Get booking details
        const b = data.data;
        setBooking(b);
        if (b.serviceLocation?.coordinates) {
          const [lng, lat] = b.serviceLocation.coordinates;
          const dPos = [lat, lng];
          // Use real groomer location if available, otherwise a mock starting point
          const gCoord = b.groomerId?.location?.coordinates || [lng - 0.012, lat - 0.015];
          const gStart = [gCoord[1], gCoord[0]];
          setDestPos(dPos);
          setGroomerPos(gStart);
          
          // Fetch the actual road path from OSRM via our helper
          const pathObjects = await getLiveRoute({ lat: gStart[0], lng: gStart[1] }, { lat: dPos[0], lng: dPos[1] });
          const path = pathObjects.map((p) => [p.lat, p.lng]);
          setRoutePath(path);
          setEtaMinutes(Math.max(3, Math.ceil(path.length / 8))); // Estimate ETA based on path length
          setCurrentStep(0);
        }
      } catch (err) { console.error("Error fetching booking:", err); }
    };

    fetchBooking();
    socketRef.current.emit("join-booking", bookingId); // Join a specific socket room for this booking
    // Listen for location updates from the groomer side
    socketRef.current.on("location-updated", (coords) => setGroomerPos([coords[1], coords[0]]));
    return () => socketRef.current.disconnect(); // Cleanup connection on unmount
  }, [bookingId]);

  /**
   * Simulation function: Moves the groomer marker along the road path
   */
  const simulateMove = async () => {
    if (routePath.length === 0) return;
    
    // Update status to "On the Way" if it's not already
    if (!booking || !["On the Way","Arrived","Completed"].includes(booking.status)) {
      try {
        await axios.put(`${API}/api/bookings/${bookingId}/status`, { status: "On the Way" });
        setBooking((prev) => ({ ...prev, status: "On the Way" }));
      } catch (err) { console.error("Failed to update status:", err); }
    }

    // Move forward in the path array
    const stepIncrement = Math.max(1, Math.ceil(routePath.length / 15));
    const nextStep = Math.min(currentStep + stepIncrement, routePath.length - 1);
    const newPos = routePath[nextStep];
    
    setGroomerPos(newPos);
    setCurrentStep(nextStep);
    
    // Check if arrived at destination
    if (nextStep === routePath.length - 1) {
      try {
        await axios.put(`${API}/api/bookings/${bookingId}/status`, { status: "Arrived" });
        setBooking((prev) => ({ ...prev, status: "Arrived" }));
        setEtaMinutes(0);
      } catch (err) { console.error("Failed to update status:", err); }
    }
    
    // Emit the new location to other connected users (e.g. the customer)
    socketRef.current?.emit("groomer-location-update", { bookingId, coordinates: [newPos[1], newPos[0]] });
  };

  // Combine all coordinates for fitting the map view
  const allPoints = [destPos, ...(groomerPos ? [groomerPos] : []), ...routePath];
  const etaLabel = etaMinutes === null ? "Calculating..." : etaMinutes === 0 ? "Arrived!" : `~${etaMinutes} min`;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 flex flex-col">
      {/* Page Header Area */}
      <div className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/groomers")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.05rem" }}>Live Tracking</h1>
              <p className="text-slate-500 text-xs">{booking?.groomerId?.name || "Your Groomer"} · Grooming in progress</p>
            </div>
          </div>
          {/* Status Display Area */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">ETA</p>
              <p style={{ color: config.color, fontWeight: 800, fontSize: "1.1rem" }}>{etaLabel}</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold" style={{ background: config.bg, color: config.color }}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="relative border-y border-slate-100 shadow-inner" style={{ height: "500px", zIndex: 10 }}>
        <MapContainer center={destPos} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBounds points={allPoints} /> {/* Auto-zoom logic */}
          {groomerPos && <ChangeView center={groomerPos} />} {/* Auto-pan logic */}
          <Marker position={destPos} icon={destIcon} /> {/* Destination (Customer) Pin */}
          {groomerPos && <Marker position={groomerPos} icon={groomerIcon} />} {/* Groomer Live Pin */}
        </MapContainer>

        {/* Floating Info Overlay on Map */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-xl border border-slate-100 flex items-center gap-4 z-[1000]">
          <div>
            <p className="text-slate-800 text-xs font-bold">{booking?.groomerId?.name || "Your Groomer"}</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Active Groomer</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 text-xs font-semibold">
              ETA: <span style={{ color: config.color }}>{etaLabel}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info / Status Stepper Area */}
      <div className="bg-white border-t border-slate-100 px-4 py-5">
        <div className="max-w-7xl mx-auto">
          {/* Visual Status Stepper (Pending → Accepted → On the Way → Arrived → Completed) */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
            {trackingStatuses.map((status, i) => {
              const isCompleted = i < statusIndex;
              const isCurrent = i === statusIndex;
              const sCfg = statusConfig[status];
              return (
                <div key={status} className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={
                        isCurrent
                          ? { background: sCfg.color, color: "white", boxShadow: `0 0 0 3px ${sCfg.bg}` }
                          : isCompleted
                          ? { background: "#0D9488", color: "white" }
                          : { background: "#F1F5F9", color: "#94A3B8" }
                      }
                    >
                      {isCompleted ? "✓" : i + 1}
                    </div>
                    <span
                      className="whitespace-nowrap"
                      style={{
                        color: isCurrent ? sCfg.color : isCompleted ? "#0D9488" : "#94A3B8",
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: "0.65rem",
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  {/* Connecting line between steps */}
                  {i < trackingStatuses.length - 1 && (
                    <div className="h-0.5 w-8 sm:w-12 rounded-full mb-4" style={{ background: i < statusIndex ? "#0D9488" : "#E2E8F0" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Description and Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 p-4 rounded-xl" style={{ background: config.bg }}>
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4" style={{ color: config.color }} />
                <span style={{ color: config.color, fontWeight: 700, fontSize: "0.9rem" }}>{config.label}</span>
              </div>
              <p className="text-slate-600 text-sm">{config.desc}</p>
            </div>
            {/* Address Summary Section */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Destination</p>
                  <p className="text-slate-800 text-xs mt-0.5">{booking?.serviceLocation?.address || "Your Location"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Groomer Start</p>
                  <p className="text-slate-800 text-xs mt-0.5">{booking?.groomerId?.address || "Groomer Location"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Controls (Visible until arrived) */}
          {currentStatus !== "Completed" && (
            <button
              onClick={simulateMove}
              disabled={currentStep >= routePath.length - 1 && routePath.length > 0}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0D9488,#14B8A6)" }}
            >
              <Zap className="w-4 h-4" />
              {currentStep >= routePath.length - 1 && routePath.length > 0 ? "Groomer Arrived" : "Simulate Groomer Moving"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
