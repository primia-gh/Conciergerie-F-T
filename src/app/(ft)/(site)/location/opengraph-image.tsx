import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Conciergerie F&T — location courte durée";

/** Image d'aperçu de l'accueil F&T (partage WhatsApp, réseaux sociaux), en « Nuit en forêt ». */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 88,
          backgroundColor: "#1b241e",
          color: "#f3ede2",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 5, color: "#e3a07a" }}>CONCIERGERIE DE LOCATION COURTE DURÉE</div>
        <div style={{ fontSize: 80, marginTop: 28 }}>Conciergerie F&amp;T</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#b9b2a3" }}>
          Votre maison entre de bonnes mains. Votre séjour aussi.
        </div>
      </div>
    ),
    { ...size },
  );
}
