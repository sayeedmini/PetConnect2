import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteLayout from "../../../components/SiteLayout";

const ReportSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const rescueId = location.state?.rescueId || "Not available";
  const status = location.state?.status || "Open";

  return (
    <SiteLayout>
      <div
        style={{
          backgroundImage:
            "url('/frame-with-dogs-vector-white-background_53876-127700.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "24px",
          borderRadius: "24px",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderRadius: "22px",
            padding: "40px 32px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 22px",
              borderRadius: "50%",
              backgroundColor: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
            }}
          >
            âœ…
          </div>

          <h1
            style={{
              margin: "0 0 14px 0",
              fontSize: "36px",
              lineHeight: "1.2",
              color: "#166534",
              fontWeight: "700",
            }}
          >
            Report Submitted Successfully
          </h1>

          <p
            style={{
              color: "#4b5563",
              margin: "0 auto 28px",
              fontSize: "17px",
              lineHeight: "1.6",
              maxWidth: "420px",
            }}
          >
            Your emergency animal rescue report has been submitted successfully.
            Nearby responders can now review the details.
          </p>

          <div
            style={{
              background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
              border: "1px solid #bbf7d0",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "28px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "12px",
                marginBottom: "12px",
                borderBottom: "1px solid #d1fae5",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#374151",
                  fontWeight: "600",
                }}
              >
                Rescue ID
              </span>
              <span
                style={{
                  fontSize: "18px",
                  color: "#111827",
                  fontWeight: "700",
                }}
              >
                {rescueId}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  color: "#374151",
                  fontWeight: "600",
                }}
              >
                Status
              </span>
              <span
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "700",
                }}
              >
                {status}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/rescue/dashboard")}
              style={{
                padding: "14px 24px",
                background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "16px",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
                transition: "0.2s ease",
              }}
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/rescue/tracking")}
              style={{
                marginTop: "14px",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "16px",
                boxShadow: "0 10px 25px rgba(47, 111, 143, 0.25)",
                transition: "0.2s ease",
              }}
            >
              Track My Rescue
            </button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
};

export default ReportSuccessPage;
