import React, { useState, useEffect } from "react"; // Import core React hooks for state and lifecycle management
import { useNavigate } from "react-router-dom"; // Hook for programmatic navigation between pages
import axios from "axios"; // HTTP client for making API requests to the backend
import { Star, MapPin, ChevronDown, Search, ArrowRight, Sparkles } from "lucide-react"; // Modern icon library
import ImageWithFallback from "../components/ImageWithFallback"; // Component to handle broken images gracefully
import { getGroomerAvatar } from "../utils/groomerAvatar"; // Utility to get a random or specific avatar for groomers

// API Base URL from environment variables or default to localhost
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Static list of grooming services for the filter dropdown
const allServices = [
  "All Services",
  "Bath & Brush",
  "Full Grooming",
  "Nail Trimming",
  "Ear Cleaning",
  "Teeth Brushing",
  "De-Shedding",
  "Flea Treatment",
  "Creative Styling",
  "Spa Massage",
];

const GroomerDirectory = () => {
  const [groomers, setGroomers] = useState([]); // State to store the list of groomers fetched from API
  const [loading, setLoading] = useState(true); // State to track if data is currently being loaded
  const [selectedService, setSelectedService] = useState("All Services"); // State for the active service filter
  const [searchQuery, setSearchQuery] = useState(""); // State for the text search input
  const navigate = useNavigate(); // Initialize navigation function

  // Fetch groomers whenever the selectedService changes
  useEffect(() => {
    const fetchGroomers = async () => {
      try {
        setLoading(true); // Show loading spinner
        // Construct URL: filter by service if a specific one is selected, otherwise get all
        const url =
          selectedService !== "All Services"
            ? `${API}/api/groomers/search?service=${encodeURIComponent(selectedService)}`
            : `${API}/api/groomers/search`;
        const { data } = await axios.get(url); // Perform GET request
        setGroomers(data.data || []); // Update state with fetched groomer data
      } catch (err) {
        console.error("Error fetching groomers:", err); // Log errors for debugging
        setGroomers([]); // Reset list on error to prevent crashes
      } finally {
        setLoading(false); // Hide loading spinner
      }
    };
    fetchGroomers();
  }, [selectedService]); // dependency array ensures this runs when service filter changes

  // Client-side filtering based on search query (name or address)
  const filtered = groomers.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.address && g.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50"> {/* Main container with light background */}
      {/* Hero Header Section with decorative gradients */}
      <div
        className="relative pt-28 pb-16 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F0FDFA 0%, #E0F7F5 50%, #FFF7ED 100%)" }}
      >
        {/* Background decorative blobs (using radial gradients) */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #99F6E4 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #FED7AA 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Badge for branding/trust */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#CCFBF1", color: "#0F766E" }}
            >
              <Sparkles className="w-3 h-3" />
              Trusted Pet Care in Bangladesh
            </span>
          </div>
          {/* Main Hero Title */}
          <h1
            className="text-slate-900 mb-3"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Find the perfect groomer
            <br />
            <span style={{ color: "#0D9488" }}>for your best bud.</span>
          </h1>
          <p className="text-slate-500 max-w-xl" style={{ fontSize: "1.05rem" }}>
            Browse verified, experienced groomers near you — book home grooming in minutes.
          </p>

          {/* Search & Filter Bar Row */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search groomers or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                style={{ fontSize: "0.875rem" }}
              />
            </div>
            {/* Service Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="appearance-none w-full sm:w-52 pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200 cursor-pointer"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                {allServices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          {/* Result Count Message */}
          <p className="text-slate-500 text-sm">
            {loading ? (
              "Loading groomers..."
            ) : (
              <>
                Showing <span className="font-semibold text-slate-800">{filtered.length}</span> groomers
                {selectedService !== "All Services" && (
                  <>
                    {" "}for{" "}
                    <span className="font-semibold" style={{ color: "#0D9488" }}>
                      "{selectedService}"
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Conditional Rendering: Loading vs Empty vs Data */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin"
            />
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State UI */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-slate-100">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-700 mb-2" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              No groomers found
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Try adjusting your filters or search term to find the right groomer.
            </p>
            <button
              onClick={() => {
                setSelectedService("All Services");
                setSearchQuery("");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#0D9488" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Responsive Grid of Groomer Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((g) => (
              <GroomerCard
                key={g._id}
                groomer={g}
                onClick={() => navigate(`/groomers/${g._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Sub-component for individual Groomer cards
 */
function GroomerCard({ groomer, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      {/* Top Image Section */}
      <div className="relative h-52 overflow-hidden">
        <ImageWithFallback
          src={getGroomerAvatar(groomer)}
          alt={groomer.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle dark gradient overlay for better text contrast */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" }}
        />
        {/* Rating badge bottom-left on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-white text-xs font-bold">{(groomer.rating ?? 4.9).toFixed(1)}</span>
          <span className="text-white/80 text-xs">({groomer.reviewCount ?? 0})</span>
        </div>

        {/* Experience badge top-right (Glassmorphism style) */}
        {groomer.experience && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm">
            {groomer.experience}
          </div>
        )}
      </div>

      {/* Content Section below image */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-slate-900" style={{ fontWeight: 700 }}>
              {groomer.name}
            </h3>
            {/* Address / Location Line */}
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500 text-xs">{groomer.address || "Location not specified"}</span>
            </div>
          </div>
          {/* Verified Status Badge */}
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
            style={{ background: "#F0FDFA", color: "#0D9488" }}
          >
            Verified
          </span>
        </div>

        {/* Service Tags (displays first 3 services) */}
        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {groomer.services?.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100"
            >
              {s}
            </span>
          ))}
          {/* Count of additional services if more than 3 */}
          {groomer.services?.length > 3 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
              +{groomer.services.length - 3}
            </span>
          )}
        </div>

        {/* View Profile Action Button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95"
          style={{ background: "linear-gradient(135deg, #0D9488, #14B8A6)" }}
        >
          View Profile
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

export default GroomerDirectory; // Export for use in routing
