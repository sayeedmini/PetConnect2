import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import SiteLayout from "../../../components/SiteLayout";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API);

function TrackingDashboardPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();

    socket.on("tracking_updated", handleTrackingUpdate);
    socket.on("rescue_status_updated", handleStatusUpdate);
    socket.on("rescue_completed", handleCompleted);
    socket.on("new_rescue_request", handleNewRequest);

    return () => {
      socket.off("tracking_updated");
      socket.off("rescue_status_updated");
      socket.off("rescue_completed");
      socket.off("new_rescue_request");
    };
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(
        `${API}/api/reports/tracking/active/all`
      );

      const acceptedOnly = res.data.filter(
        (r) => r.status === "Accepted"
      );

      setReports(acceptedOnly);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewRequest = (data) => {
    if (data.status !== "Accepted") return;

    setReports((prev) => {
      const exists = prev.some((r) => r.rescueId === data.rescueId);
      if (exists) return prev;

      return [data, ...prev];
    });
  };

  const handleTrackingUpdate = (data) => {
    setReports((prev) =>
      prev.map((r) =>
        r.rescueId === data.rescueId ? { ...r, ...data } : r
      )
    );
  };

  const handleStatusUpdate = (data) => {
    setReports((prev) => {
      const updatedReports = prev.map((r) =>
        r.rescueId === data.rescueId ? { ...r, ...data } : r
      );

      return updatedReports.filter((r) => r.status === "Accepted");
    });

    fetchReports();
  };

  const handleCompleted = (data) => {
    setReports((prev) =>
      prev.filter((r) => r.rescueId !== data.rescueId)
    );
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
          overflow: "hidden",
          position: "relative",

        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))",
            backdropFilter: "blur(4px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "24px",
          }}
        >
          <h2 style={{ color: "white", marginBottom: "20px", textAlign: "center" }}>Live Rescue Dashboard</h2>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div
              style={{
                flex: 2,
                minWidth: "300px",
                backdropFilter: "blur(10px)",
                background: "rgba(255,255,255,0.1)",
                padding: "10px",
                borderRadius: "12px",
              }}
            >
              <MapContainer
                center={[23.8103, 90.4125]}
                zoom={12}
                style={{ height: "500px", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {reports.map((r) => (
                  <React.Fragment key={r.rescueId}>
                    <Marker position={[r.lat, r.lng]}>
                      <Popup>
                        Rescue Location <br />
                        {r.description}
                      </Popup>
                    </Marker>

                    {r.currentRescuerLat && (
                      <Marker
                        position={[
                          r.currentRescuerLat,
                          r.currentRescuerLng,
                        ]}
                      >
                        <Popup>Rescuer Location</Popup>
                      </Marker>
                    )}
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "280px",
                backdropFilter: "blur(20px)",
                background: "rgba(255,255,255,0.12)",
                padding: "20px",
                borderRadius: "20px",
                color: "white",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                maxHeight: "500px",
                overflowY: "auto",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>Active Rescues</h3>

              {reports.map((r) => {
                const filteredLogs = [];
                let locationUpdateShown = false;

                if (r.trackingLogs && r.trackingLogs.length > 0) {
                  r.trackingLogs
                    .slice()
                    .reverse()
                    .forEach((log) => {
                      if (log.eventType === "location_update") {
                        if (!locationUpdateShown) {
                          filteredLogs.push({
                            ...log,
                            message: "Rescuer started moving",
                          });
                          locationUpdateShown = true;
                        }
                      } else {
                        filteredLogs.push(log);
                      }
                    });
                }

                return (
                  <div
                    key={r.rescueId}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    style={{
                      marginBottom: "15px",
                      padding: "15px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                      transition: "0.3s ease",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ marginBottom: "6px", fontSize: "14px" }}>
                      <strong>ID:</strong> {r.rescueId}
                    </div>

                    <div style={{ marginBottom: "6px", fontSize: "14px" }}>
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          background:
                            r.status === "Accepted"
                              ? "rgba(0, 255, 150, 0.2)"
                              : "rgba(255, 200, 0, 0.2)",
                        }}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.8,
                      }}
                    >
                      {r.description}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "8px",
                          opacity: 0.9,
                        }}
                      >
                        Tracking Logs
                      </div>

                      <div
                        style={{
                          maxHeight: "120px",
                          overflowY: "auto",
                          paddingRight: "4px",
                          textAlign: "center",
                        }}
                      >
                        {filteredLogs.length > 0 ? (
                          filteredLogs.map((log, index) => (
                            <div
                              key={index}
                              style={{
                                fontSize: "12px",
                                marginBottom: "8px",
                                padding: "8px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.05)",
                              }}
                            >
                              <div style={{ fontWeight: "600" }}>
                                {log.eventType}
                              </div>

                              <div style={{ opacity: 0.85 }}>
                                {log.message}
                              </div>

                              <div
                                style={{
                                  opacity: 0.6,
                                  marginTop: "4px",
                                }}
                              >
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              fontSize: "12px",
                              opacity: 0.7,
                            }}
                          >
                            No tracking logs yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export default TrackingDashboardPage;
