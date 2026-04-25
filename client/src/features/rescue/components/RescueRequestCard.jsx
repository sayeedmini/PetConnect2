import React from "react";

function RescueRequestCard({
  request,
  onAccept,
  onReject,
  onMarkAsSeen,
  onComplete,
}) {
  return (
    <div
      onClick={() => {
        if (request.isNew && onMarkAsSeen) {
          onMarkAsSeen(request.rescueId);
        }
      }}
      style={{
        border: request.isNew
          ? "1.5px solid #22c55e"
          : "1px solid rgba(255,255,255,0.4)",
        borderRadius: "14px",
        padding: "18px 20px",
        marginBottom: "14px",
        backgroundColor: request.isNew
          ? "rgba(34, 197, 94, 0.12)"
          : "rgba(255,255,255,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: request.isNew
          ? "0 6px 18px rgba(34, 197, 94, 0.15)"
          : "0 8px 24px rgba(0,0,0,0.06)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "20px",
            fontWeight: "700",
          }}
        >
          Rescue ID: {request.rescueId}
        </h3>

        {request.isNew && (
          <span
            style={{
              backgroundColor: "#22c55e",
              color: "#ffffff",
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            New
          </span>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "14px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px 0",
            color: "#374151",
            fontSize: "18px",
            fontWeight: "500",
          }}
        >
          {request.description}
        </p>

        <p style={{ margin: "6px 0", color: "#6b7280", fontSize: "16px" }}>
          Location: {request.location}
        </p>

        <p style={{ margin: "6px 0", color: "#6b7280", fontSize: "16px" }}>
          Distance: {request.distance}
        </p>

        <p
          style={{
            margin: "10px 0 0 0",
            fontWeight: "700",
            color: "#2563eb",
            fontSize: "18px",
          }}
        >
          Status: {request.status}
        </p>
      </div>

      {request.status === "Open" ? (
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(request.rescueId);
            }}
            style={{
              padding: "10px 18px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Accept
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject(request.rescueId);
            }}
            style={{
              padding: "10px 18px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Reject
          </button>
        </div>
      ) : request.status === "Accepted" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(request.rescueId);
            }}
            style={{
              padding: "10px 18px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Completed
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default RescueRequestCard;