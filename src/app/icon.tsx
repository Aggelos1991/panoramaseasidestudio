import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e3a5f",
          borderRadius: "6px",
          color: "white",
          fontSize: "20px",
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
