import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import RescueRequestCard from "../components/RescueRequestCard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SiteLayout from "../../../components/SiteLayout";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API);

const locationCache = {};

const getLocationName = async (lat, lng) => {
  const key = `${lat},${lng}`;


  if (locationCache[key]) {
    return locationCache[key];
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );

    const data = await res.json();
    const locationName = data.display_name || "Unknown location";

    if (locationName !== "Unknown location") {
      locationCache[key] = locationName;
    }

    return locationName;
  } catch (error) {
    console.error("Error getting location name:", error);

    return locationCache[key] || "Unknown location";
  }
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(2);
};

function RescuerDashboardPage() {
  const [requests, setRequests] = useState([]);
  const [activeRescues, setActiveRescues] = useState([]);
  const [rescuerLocation, setRescuerLocation] = useState(null);

  const prevNewCountRef = useRef(0);
  const audioRef = useRef(null);
  const watchIdRef = useRef(null);
  const activeRescuesRef = useRef([]);
  const hasFetchedReportsRef = useRef(false);
  const rescuerLocationRef = useRef(null);

  const [showStoryPopup, setShowStoryPopup] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [currentRescueId, setCurrentRescueId] = useState(null);

  const [storyTitle, setStoryTitle] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [storyImage, setStoryImage] = useState(null);

  const newRequestCount = requests.filter((request) => request.isNew).length;

  useEffect(() => {
    activeRescuesRef.current = activeRescues;
  }, [activeRescues]);

  useEffect(() => {
    rescuerLocationRef.current = rescuerLocation;
  }, [rescuerLocation]);

  useEffect(() => {
    audioRef.current = new Audio("/mixkit-software-interface-start-2574.wav");
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRescuerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting rescuer location:", error);
      }
    );
  }, []);

  useEffect(() => {
    if (!rescuerLocation || hasFetchedReportsRef.current) return;

    const fetchReports = async () => {
      try {
        const [openResponse, acceptedResponse] = await Promise.all([
          axios.get(`${API}/api/reports/open`),
          axios.get(`${API}/api/reports/accepted`),
        ]);

        const formattedOpenRequests = await Promise.all(
          openResponse.data.map(async (report) => {
            const locationName = await getLocationName(report.lat, report.lng);
            const distance = calculateDistance(
              rescuerLocation.lat,
              rescuerLocation.lng,
              report.lat,
              report.lng
            );

            return {
              rescueId: report.rescueId,
              description: report.description,
              location: locationName,
              distance: `${distance} km`,
              status: report.status,
              isNew:
                Date.now() - new Date(report.createdAt).getTime() <
                5 * 60 * 1000,
            };
          })
        );

        const formattedAcceptedRequests = await Promise.all(
          acceptedResponse.data.map(async (report) => {
            const locationName = await getLocationName(report.lat, report.lng);
            const distance = calculateDistance(
              rescuerLocation.lat,
              rescuerLocation.lng,
              report.lat,
              report.lng
            );

            return {
              rescueId: report.rescueId,
              description: report.description,
              location: locationName,
              distance: `${distance} km`,
              status: report.status,
              isNew: false,
            };
          })
        );

        setRequests(formattedOpenRequests);
        setActiveRescues(formattedAcceptedRequests);
        hasFetchedReportsRef.current = true;
      } catch (error) {
        console.error("Error fetching rescue reports:", error);
      }
    };

    fetchReports();
  }, [rescuerLocation]);

  useEffect(() => {
    const handleNewRescueRequest = async (newRequest) => {
      if (!rescuerLocationRef.current) return;

      const locationName = await getLocationName(newRequest.lat, newRequest.lng);
      const distance = calculateDistance(
        rescuerLocationRef.current.lat,
        rescuerLocationRef.current.lng,
        newRequest.lat,
        newRequest.lng
      );

      const formattedRequest = {
        rescueId: newRequest.rescueId,
        description: newRequest.description,
        location: locationName,
        distance: `${distance} km`,
        status: newRequest.status,
        isNew: true,
      };

      setRequests((prev) => {
        const alreadyExists = prev.some(
          (request) => request.rescueId === newRequest.rescueId
        );

        if (alreadyExists) return prev;

        return [formattedRequest, ...prev];
      });
    };

    socket.on("new_rescue_request", handleNewRescueRequest);

    return () => {
      socket.off("new_rescue_request", handleNewRescueRequest);
    };
  }, []);

  useEffect(() => {
    if (newRequestCount > prevNewCountRef.current) {
      toast.success("New rescue request received!");

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log("Audio play blocked:", error);
        });
      }
    }

    prevNewCountRef.current = newRequestCount;
  }, [newRequestCount]);

  useEffect(() => {
    const stopTracking = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    if (activeRescues.length === 0) {
      stopTracking();
      return;
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const latestLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setRescuerLocation(latestLocation);

        try {
          await Promise.all(
            activeRescuesRef.current.map((rescue) =>
              axios.put(
                `${API}/api/reports/${rescue.rescueId}/tracking`,
                {
                  currentRescuerLat: latestLocation.lat,
                  currentRescuerLng: latestLocation.lng,
                  message: "Rescuer is on the way",
                }
              )
            )
          );
        } catch (error) {
          console.error("Error sending live tracking update:", error);
        }
      },
      (error) => {
        console.error("Error watching rescuer location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      stopTracking();
    };
  }, [activeRescues]);

  const handleAccept = async (rescueId) => {
    try {
      await axios.put(`${API}/api/reports/${rescueId}/accept`);

      const acceptedRequest = requests.find(
        (request) => request.rescueId === rescueId
      );

      setRequests((prev) =>
        prev.filter((request) => request.rescueId !== rescueId)
      );

      if (acceptedRequest) {
        const updatedAcceptedRequest = {
          ...acceptedRequest,
          status: "Accepted",
          isNew: false,
        };

        setActiveRescues((prev) => [updatedAcceptedRequest, ...prev]);

        if (rescuerLocation) {
          try {
            await axios.put(
              `${API}/api/reports/${rescueId}/tracking`,
              {
                currentRescuerLat: rescuerLocation.lat,
                currentRescuerLng: rescuerLocation.lng,
                message: "Rescuer accepted and started moving",
              }
            );
          } catch (error) {
            console.error("Error sending initial tracking update:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error accepting report:", error);
      toast.error("Failed to accept request.");
    }
  };

  const handleReject = async (rescueId) => {
    try {
      await axios.put(`${API}/api/reports/${rescueId}/reject`);

      setRequests((prev) =>
        prev.filter((request) => request.rescueId !== rescueId)
      );
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast.error("Failed to reject request.");
    }
  };

  const handleComplete = async (rescueId) => {
    try {
      await axios.put(`${API}/api/reports/${rescueId}/complete`);

      setActiveRescues((prev) =>
        prev.filter((request) => request.rescueId !== rescueId)
      );

      setCurrentRescueId(rescueId);
      setShowStoryPopup(true);
      setShowStoryForm(false);

    } catch (error) {
      console.error("Error completing report:", error);
      toast.error("Failed to complete rescue.");
    }
  };

  const handleSubmitStory = async () => {
  try {
    const formData = new FormData();

    formData.append("storyTitle", storyTitle);
    formData.append("storyDescription", storyDescription);

    if (storyImage) {
      formData.append("image", storyImage);
    }

    await axios.put(
      `${API}/api/reports/${currentRescueId}/success-story`,
      formData
    );

    toast.success("Success story added!");

    setShowStoryPopup(false);
    setShowStoryForm(false);

    setStoryTitle("");
    setStoryDescription("");
    setStoryImage(null);
  } catch (error) {
    console.error("Error saving story:", error);
    toast.error("Failed to save story");
  }
 };


  const handleMarkAsSeen = (rescueId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.rescueId === rescueId
          ? { ...request, isNew: false }
          : request
      )
    );
  };

  return (
    <SiteLayout>
      <div
        style={{
          backgroundImage:
            "url('/frame-with-dogs-vector-white-background_53876-127700.avif')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          backgroundSize: "cover",
          borderRadius: "24px",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
            margin: "0 auto 18px auto",
            padding: "16px",
            borderRadius: "20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: "0",
                  fontSize: "32px",
                  color: "#1f2937",
                }}
              >
                Nearby Rescue Requests
              </h1>

              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "16px",
                  color: "#6b7280",
                }}
              >
                Live alerts for nearby animal rescue emergencies
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f6e8d8",
                color: "#d97706",
                padding: "10px 16px",
                borderRadius: "999px",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Notifications: {newRequestCount}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
              color: "#111827",
              textAlign: "center",
              fontSize: "24px",
            }}
          >
            Active Rescue
          </h2>

          {activeRescues.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center" }}>
              No active rescues yet.
            </p>
          ) : (
            activeRescues.map((request) => (
              <RescueRequestCard
                key={request.rescueId}
                request={request}
                onAccept={() => {}}
                onReject={() => {}}
                onMarkAsSeen={() => {}}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
              color: "#111827",
              textAlign: "center",
              fontSize: "24px",
            }}
          >
            Incoming Requests
          </h2>

          {requests.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center" }}>
              No open rescue requests found.
            </p>
          ) : (
            requests.map((request) => (
              <RescueRequestCard
                key={request.rescueId}
                request={request}
                onAccept={handleAccept}
                onReject={handleReject}
                onMarkAsSeen={handleMarkAsSeen}
                onComplete={() => {}}
              />
            ))
          )}
        </div>
        </div>
      {showStoryPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.28)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "rgba(255, 255, 255, 0.56)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
          >
            {!showStoryForm ? (
              <>
                <h3
                  style={{
                    margin: "0 0 10px 0",
                    color: "#1f2937",
                    fontSize: "26px",
                    textAlign: "center",
                  }}
                >
                  Rescue Completed
                </h3>

                <p
                  style={{
                    margin: "0 0 22px 0",
                    color: "#6b7280",
                    textAlign: "center",
                    fontSize: "15px",
                    lineHeight: "1.6",
                  }}
                >
                  Do you want to add this rescue as a success story?
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setShowStoryForm(true)}
                    style={{
                      backgroundColor: "#256eeb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 18px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
                    }}
                  >
                    Add Story
                  </button>

                  <button
                    onClick={() => {
                      setShowStoryPopup(false);
                      setShowStoryForm(false);
                      setStoryTitle("");
                      setStoryDescription("");
                      setStoryImage(null);
                    }}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.55)",
                      color: "#111827",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: "10px",
                      padding: "10px 18px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#1f2937",
                    fontSize: "24px",
                    textAlign: "center",
                  }}
                >
                  Add Success Story
                </h3>

                <input
                  type="text"
                  placeholder="Enter story title"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    marginBottom: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.35)",
                    backgroundColor: "rgba(255,255,255,0.55)",
                    color: "#111827",
                    outline: "none",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />

                <textarea
                  placeholder="Enter story description"
                  value={storyDescription}
                  onChange={(e) => setStoryDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    marginBottom: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.35)",
                    backgroundColor: "rgba(255,255,255,0.55)",
                    color: "#111827",
                    outline: "none",
                    fontSize: "14px",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.35)",
                    backgroundColor: "rgba(255,255,255,0.55)",
                  }}
                >
                <div
                  style={{
                    border: "2px dashed #3b82f6",
                    backgroundColor: "#eff6ff",
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setStoryImage(e.target.files[0])}
                    style={{
                      fontSize: "14px",
                      color: "#111827",
                    }}
                  />
                </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleSubmitStory}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 18px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(22, 163, 74, 0.22)",
                    }}
                  >
                    Submit
                  </button>

                  <button
                    onClick={() => {
                      setShowStoryPopup(false);
                      setShowStoryForm(false);
                      setStoryTitle("");
                      setStoryDescription("");
                      setStoryImage(null);
                    }}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.55)",
                      color: "#111827",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: "10px",
                      padding: "10px 18px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-right" />
    </SiteLayout>
  );
}

export default RescuerDashboardPage;
