import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image d'aperçu de la page de choix : une moitié par activité, à ses couleurs. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 64,
            backgroundColor: "#f6f1e8",
            color: "#1f2a22",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#4a5d4f" }}>LOCATION COURTE DURÉE</div>
          <div style={{ fontSize: 60, marginTop: 20, color: "#2e3b32" }}>Conciergerie F&amp;T</div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            padding: 64,
            backgroundColor: "#fafaf9",
            color: "#1c1917",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#a16207" }}>CONCIERGERIE PRIVÉE</div>
          <div style={{ fontSize: 60, marginTop: 20 }}>Conciergerie Premium</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
