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
            backgroundColor: "#1b241e",
            color: "#f3ede2",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#e3a07a" }}>LOCATION COURTE DURÉE</div>
          <div style={{ fontSize: 60, marginTop: 20, color: "#f3ede2" }}>Conciergerie F&amp;T</div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            padding: 64,
            backgroundColor: "#0e1a31",
            color: "#f4f1ea",
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#c9a24e" }}>CONCIERGERIE PRIVÉE</div>
          <div style={{ fontSize: 60, marginTop: 20 }}>Conciergerie Premium</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
