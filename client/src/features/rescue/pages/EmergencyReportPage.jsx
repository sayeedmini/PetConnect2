import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { loginUser } from "../../auth/services/authApi";
import { saveAuth } from "../../auth/utils/auth";
import SiteLayout from "../../../components/SiteLayout";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const defaultCenter = [23.8103, 90.4125];

function LocationPicker({ onPickLocation, selectedPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPickLocation(lat, lng);
    },
  });

  return selectedPosition ? <Marker position={selectedPosition} /> : null;
}

const EmergencyReportPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationSource, setLocationSource] = useState("");
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showRescuerLogin, setShowRescuerLogin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginData, setLoginData] = useState({ email: '', password: '', });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationSource("auto");
      },
      () => {
        setLocationError(
          "Location access denied. Please pin your location manually."
        );
        setShowMap(true);
      }
    );
  }, []);

  const handleManualPin = (pickedLat, pickedLng) => {
    setLat(pickedLat);
    setLng(pickedLng);
    setLocationSource("manual");
    setLocationError("");
    setShowMap(true);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = (removeIndex) => {
    const updatedFiles = files.filter((_, index) => index !== removeIndex);
    setFiles(updatedFiles);

    if (updatedFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setDescription("");
    setFiles([]);
    setLat(null);
    setLng(null);
    setLocationSource("");
    setLocationError("");
    setShowMap(false);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenRescuerLogin = () => {
    setLoginError("");
    setShowRescuerLogin(true);
  };

  const handleCloseRescuerLogin = () => {
    setShowRescuerLogin(false);
    setLoginError("");
  };

  const handleLoginChange = (e) => {
  setLoginData((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
  };

  const handleRescuerLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const data = await loginUser(loginData);  

      if (data.user.role !== "rescuer") {
        setLoginError("Only rescuers can access the rescuer dashboard.");
        return;
      }

      saveAuth(data.token, data.user); 

      navigate("/rescue/dashboard");

    } catch (error) {
      setLoginError(error?.response?.data?.message || "Login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!description.trim()) {
      setSubmitError("Description is required.");
      return;
    }

    if (lat === null || lng === null) {
      setSubmitError("Location is required.");
      return;
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("locationSource", locationSource);

    files.forEach((file) => {
      formData.append("media", file);
    });

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${API}/api/reports`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const rescueId = response.data.rescueId;
      const status = response.data.status;

      resetForm();

      navigate("/rescue/report-success", {
        state: {
          rescueId,
          status,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      setSubmitError("Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPosition = lat !== null && lng !== null ? [lat, lng] : null;

  const floatingButtonStyle = {
    border: "none",
    borderRadius: "999px",
    padding: "12px 22px",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    transition: "all 0.2s ease",
  };

  return (
    <SiteLayout>
      <div
        style={{
          backgroundImage:
            "url('/frame-with-dogs-vector-white-background_53876-127700.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "24px",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto 20px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={handleOpenRescuerLogin}
            style={{
              ...floatingButtonStyle,
              background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
            }}
          >
            Login as Rescuer
          </button>
        </div>

        <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "10px", fontSize: "28px", color: "#1f2937" }}>
          Report Distressed Animal
        </h1>

        <p style={{ marginBottom: "25px", color: "#374151", fontSize: "15px" }}>
          Submit the animal&apos;s details and location so nearby rescuers can
          respond.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Describe the situation..."
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                resize: "vertical",
                backgroundColor: "#ffffff",
                color: "#111111",
                caretColor: "#111111",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Upload Photos or Videos
            </label>

            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#f8fafc",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Choose Files
              </button>

              <p style={{ marginTop: "10px", fontSize: "14px", color: "#374151" }}>
                Upload photo or video evidence.
              </p>

              {files.length === 0 ? (
                <p style={{ marginTop: "10px", fontSize: "14px", color: "#374151" }}>
                  No file chosen
                </p>
              ) : (
                <div style={{ marginTop: "10px" }}>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <span>{file.name}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "red",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Location
            </label>

            <p style={{ margin: "4px 0", color: "#374151" }}>
              Lat: {lat ?? "Not set"}
            </p>

            <p style={{ margin: "4px 0", color: "#374151" }}>
              Lng: {lng ?? "Not set"}
            </p>

            <p style={{ margin: "4px 0", color: "#374151" }}>
              Source: {locationSource || "Not set"}
            </p>

            {locationError && (
              <p style={{ color: "red", marginTop: "8px" }}>{locationError}</p>
            )}

            {(showMap || locationSource === "manual") && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ marginBottom: "10px", color: "#374151" }}>
                  Click on the map to pin the animal&apos;s location.
                </p>

                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    zIndex: 0,
                  }}
                >
                  <MapContainer
                    center={selectedPosition || defaultCenter}
                    zoom={13}
                    style={{ height: "300px", width: "100%" }}
                    dragging={true}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker
                      onPickLocation={handleManualPin}
                      selectedPosition={selectedPosition}
                    />
                  </MapContainer>
                </div>
              </div>
            )}

            {!showMap && locationSource === "auto" && (
              <button
                type="button"
                onClick={() => {
                  setShowMap(true);
                  setLocationSource("manual");
                }}
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                Change location manually
              </button>
            )}
          </div>

          {submitError && (
            <p style={{ color: "red", marginBottom: "16px" }}>{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 18px",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
        </div>

        {showRescuerLogin && (
          <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h3
              style={{
                margin: "0 0 18px 0",
                color: "#1f2937",
                fontSize: "26px",
                textAlign: "center",
              }}
            >
              Rescuer Login
            </h3>

            {/* Email */}
            <input
              name="email"
              type="email"
              placeholder="Enter rescuer email"
              value={loginData.email}
              onChange={handleLoginChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                marginBottom: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.7)",
                color: "#111827",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            {/* Password */}
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={loginData.password}
              onChange={handleLoginChange}
              style={{
                width: "100%",
                padding: "12px 14px",
                marginBottom: "16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.7)",
                color: "#111827",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            {loginError && (
              <p style={{ color: "red", marginBottom: "12px" }}>
                {loginError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* LOGIN BUTTON (your chosen color style) */}
              <button
                onClick={handleRescuerLogin}
                style={{
                  background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                }}
              >
                Login
              </button>

              {/* CANCEL */}
              <button
                onClick={handleCloseRescuerLogin}
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  color: "#111827",
                  border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
};

export default EmergencyReportPage;
