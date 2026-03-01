import { ImageResponse } from "next/og";

export const alt = "Panorama Seaside Studios — Beachfront Accommodation in Mastichari, Kos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 40%, #c4956a 100%)",
          color: "white",
          padding: "60px",
        }}
      >
        {/* Decorative wave */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "120px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "100% 100% 0 0",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            backgroundColor: "rgba(255,255,255,0.15)",
            fontSize: "48px",
            fontWeight: 700,
            fontFamily: "serif",
            marginBottom: "24px",
          }}
        >
          P
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            fontFamily: "serif",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          Panorama Seaside Studios
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 400,
            textAlign: "center",
            marginTop: "16px",
            opacity: 0.85,
            maxWidth: "700px",
          }}
        >
          Beachfront Accommodation in Mastichari, Kos
        </div>

        {/* Divider */}
        <div
          style={{
            width: "80px",
            height: "3px",
            backgroundColor: "rgba(255,255,255,0.4)",
            marginTop: "28px",
            borderRadius: "2px",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 400,
            textAlign: "center",
            marginTop: "20px",
            opacity: 0.7,
          }}
        >
          Sea Views &bull; Restaurant &bull; Steps from the Beach
        </div>
      </div>
    ),
    { ...size },
  );
}
