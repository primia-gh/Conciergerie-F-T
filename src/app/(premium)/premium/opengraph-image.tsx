import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          backgroundColor: "#fafaf9",
          color: "#1c1917",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#a16207" }}>
          Conciergerie privée
        </div>
        <div style={{ fontSize: 72, fontWeight: 600, marginTop: 24, textAlign: "center" }}>
          Conciergerie Premium
        </div>
      </div>
    ),
    { ...size },
  );
}
