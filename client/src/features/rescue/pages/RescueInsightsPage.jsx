import React from "react";
import MonthlyRescueStats from "../components/MonthlyRescueStats";
import SuccessStoriesGallery from "../components/SuccessStoriesGallery";
import SiteLayout from "../../../components/SiteLayout";

function RescueInsightsPage() {
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
            maxWidth: "1100px",
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
            margin: "0 auto",
            padding: "16px",
            borderRadius: "20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              marginBottom: "18px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                color: "#1f2937",
              }}
            >
              Rescue Insights
            </h1>

            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: "16px",
                color: "#6b7280",
              }}
            >
              Monthly rescue analytics and success stories gallery
            </p>
          </div>

          <MonthlyRescueStats />
          <SuccessStoriesGallery />
        </div>
      </div>
    </SiteLayout>
  );
}

export default RescueInsightsPage;
