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
          backgroundColor: "#0e1a31",
          color: "#f4f1ea",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#c9a24e" }}>
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
