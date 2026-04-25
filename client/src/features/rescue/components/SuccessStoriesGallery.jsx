import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API);
const API_BASE_URL = `${API}/api/reports`;
const IMAGE_BASE_URL = `${API}/uploads`;

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SuccessStoriesGallery() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleRemoveStory = async (rescueId) => {
    try {
      await axios.put(`${API_BASE_URL}/${rescueId}/remove-success-story`);

      setStories((prev) =>
        prev.filter((story) => story.rescueId !== rescueId)
      );
    } catch (err) {
      console.error("Failed to remove success story:", err);
    }
  };

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_BASE_URL}/success-stories`);
        setStories(response.data || []);
      } catch (err) {
        console.error("Failed to fetch success stories:", err);
        setError("Failed to load success stories.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();

    socket.on("success_story_added", (newStory) => {
      setStories((prev) => [newStory, ...prev]);
    });

    socket.on("success_story_removed", ({ rescueId }) => {
      setStories((prev) =>
        prev.filter((story) => story.rescueId !== rescueId)
      );
    });

    return () => {
      socket.off("success_story_added");
      socket.off("success_story_removed");
    };
  }, []);

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "24px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937",
          }}
        >
          Success Stories
        </h2>

        <p
          style={{
            margin: "6px 0 0 0",
            color: "#4b5563",
            fontSize: "15px",
          }}
        >
          Completed rescues shared as meaningful recovery stories
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#374151" }}>Loading success stories...</p>
      ) : error ? (
        <p style={{ color: "#b91c1c" }}>{error}</p>
      ) : !stories.length ? (
        <p style={{ color: "#374151" }}>No success stories found yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {stories.map((story) => {
            const imageName =
              story.featuredImage ||
              (Array.isArray(story.media) && story.media.length > 0
                ? story.media[0]
                : "");

            const imageUrl = imageName
              ? `${IMAGE_BASE_URL}/${imageName}`
              : "";

            const title =
              story.storyTitle?.trim() || `Rescue ${story.rescueId}`;
            const description =
              story.storyDescription?.trim() ||
              story.description ||
              "A completed rescue story.";

            return (
              <div
                key={story._id || story.rescueId}
                style={{
                  backgroundColor: "rgba(255,255,255,0.58)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => handleRemoveStory(story.rescueId)}
                  title="Remove story"
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "rgba(22, 163, 74, 0.9)",
                    color: "#fff",
                    fontSize: "18px",
                    fontWeight: "700",
                    lineHeight: "1",
                    cursor: "pointer",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                  }}
                >
                  ×
                </button>

                <div
                  style={{
                    height: "220px",
                    backgroundColor: "rgba(255,255,255,0.35)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        fontSize: "15px",
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2))",
                      }}
                    >
                      No image available
                    </div>
                  )}

                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      backgroundColor: "rgba(22, 163, 74, 0.9)",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    }}
                  >
                    Completed
                  </span>
                </div>

                <div style={{ padding: "18px" }}>
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      color: "#111827",
                      fontSize: "20px",
                      fontWeight: "700",
                    }}
                  >
                    {title}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 14px 0",
                      color: "#4b5563",
                      fontSize: "15px",
                      lineHeight: "1.6",
                    }}
                  >
                    {description}
                  </p>

                  <p
                    style={{
                      margin: "0 0 8px 0",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Rescue ID: {story.rescueId}
                  </p>

                  <p
                    style={{
                      margin: "0",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    Rescue Date: {formatDate(story.completedAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SuccessStoriesGallery;
