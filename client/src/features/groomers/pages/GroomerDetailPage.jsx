import React, { useState, useEffect } from "react"; // React hooks for state and lifecycle
import { useParams, useNavigate } from "react-router-dom"; // Hooks for route parameters and navigation
import axios from "axios"; // HTTP client for backend communication
import { Star, MapPin, Clock, Check, ZoomIn, ArrowLeft, Calendar } from "lucide-react"; // UI Icons
import ImageWithFallback from "../components/ImageWithFallback"; // Component for handling missing images
import { getGroomerAvatar } from "../utils/groomerAvatar"; // Utility for profile images

// API Base URL
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GroomerDetail = () => {
  const { id } = useParams(); // Extract the groomer ID from the URL path
  const navigate = useNavigate(); // Initialize navigation
  const [groomer, setGroomer] = useState(null); // State for groomer profile data
  const [loading, setLoading] = useState(true); // Loading state
  const [lightboxImg, setLightboxImg] = useState(null); // State for the full-screen portfolio image lightbox

  // Fetch specific groomer data on component mount or when ID changes
  useEffect(() => {
    const fetchGroomer = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/api/groomers/${id}`); // GET request to fetch by ID
        setGroomer(data.data); // Update state with groomer details
      } catch (err) {
        console.error("Error fetching groomer:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroomer();
  }, [id]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
        <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  // Not Found Screen
  if (!groomer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <h2 className="text-slate-700 mb-2">Groomer not found</h2>
          <button
            onClick={() => navigate("/groomers")}
            className="text-teal-600 text-sm font-semibold hover:underline"
          >
            ← Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header Section */}
      <div
        className="relative pt-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" }}
      >
        {/* Subtle background glow effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Groomer Profile Image with border */}
            <div className="relative">
              <ImageWithFallback
                src={getGroomerAvatar(groomer)}
                alt={groomer.name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-4 shadow-2xl"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              />
            </div>

            {/* Profile Info Text Area */}
            <div className="flex-1">
              <h1
                className="text-white mb-1"
                style={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                }}
              >
                {groomer.name}
              </h1>
              {/* Info Badges Row */}
              <div className="flex flex-wrap items-center gap-4 text-teal-100">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">
                    {(groomer.rating || 4.9).toFixed(1)}
                  </span>
                  <span className="text-sm">({groomer.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{groomer.address || "Location not specified"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Verified · {groomer.experience || "Expert"} Experience</span>
                </div>
              </div>
              {/* Short Bio */}
              <p className="text-teal-100/80 mt-3 max-w-xl text-sm leading-relaxed">
                {groomer.bio || "Professional pet grooming services tailored to your pet's needs."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Layout (2 columns on large screens) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Services and Portfolio */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services Checklist Section */}
            {groomer.services && groomer.services.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-slate-900 mb-5" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  Services Offered
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {groomer.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "#CCFBF1" }}
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: "#0D9488" }} />
                      </div>
                      <span className="text-slate-700 text-sm font-medium">{service}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio / Gallery Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-slate-900 mb-5" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                Portfolio — Best Buds
              </h2>
              {groomer.portfolioImages && groomer.portfolioImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {groomer.portfolioImages.map((img, i) => (
                    <div
                      key={i}
                      className="group relative rounded-xl overflow-hidden cursor-zoom-in aspect-square"
                      onClick={() => setLightboxImg(img)} // Open lightbox on click
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`Portfolio ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
                      />
                      {/* Zoom Icon overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">No portfolio images yet.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Pricing Packages */}
          <div>
            <section>
              <h2 className="text-slate-900 mb-5" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                Pricing Packages
              </h2>
              <div className="space-y-4">
                {groomer.pricing && groomer.pricing.length > 0 ? (
                  groomer.pricing.map((pkg, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md"
                      style={{
                        borderColor: i === 0 ? "#0D9488" : "#E2E8F0", // Highlight the first package
                        borderWidth: i === 0 ? 2 : 1,
                      }}
                    >
                      {/* Badge for popular plan */}
                      {i === 0 && (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-3"
                          style={{ background: "#CCFBF1", color: "#0F766E" }}
                        >
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-slate-900" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {pkg.packageName}
                        </h3>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0D9488" }}>
                          ৳{pkg.price?.toLocaleString() || "N/A"}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mb-3 leading-relaxed">{pkg.description}</p>

                      {/* Checklist of what's included in this specific package */}
                      {pkg.includes && pkg.includes.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {pkg.includes.map((item, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: "#CCFBF1" }}
                              >
                                <Check className="w-2.5 h-2.5" style={{ color: "#0D9488" }} />
                              </div>
                              <span className="text-slate-600 text-xs">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Direct Booking Link for this package */}
                      <button
                        onClick={() => navigate(`/groomers/${groomer._id}/book`)}
                        className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        style={
                          i === 0
                            ? { background: "linear-gradient(135deg, #0D9488, #14B8A6)", color: "white" }
                            : { background: "#F8FAFC", color: "#0D9488", border: "1px solid #E2E8F0" }
                        }
                      >
                        Book This Package
                      </button>
                    </div>
                  ))
                ) : (
                  /* Fallback if no packages exist */
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-slate-400 text-sm text-center">No pricing packages available.</p>
                    <button
                      onClick={() => navigate(`/groomers/${groomer._id}/book`)}
                      className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg, #0D9488, #14B8A6)" }}
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay for viewing portfolio images full-screen */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImg(null)} // Close lightbox
        >
          <img
            src={lightboxImg}
            alt="Portfolio"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            style={{ maxHeight: "85vh" }}
          />
        </div>
      )}
    </div>
  );
};

export default GroomerDetail;
