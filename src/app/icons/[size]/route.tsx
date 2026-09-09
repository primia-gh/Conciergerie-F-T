import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

// Icônes PWA générées à la volée (mêmes couleurs que opengraph-image.tsx et
// icon.tsx — identité visuelle originale, jamais empruntée à un tiers).
// `?maskable=1` réduit le glyphe pour respecter la zone de sécurité des
// icônes adaptatives (Android) : le contenu doit tenir dans les 80% centraux.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const dimension = Number(size);

  if (!Number.isInteger(dimension) || dimension <= 0 || dimension > 1024) {
    return new Response("Taille d'icône invalide.", { status: 400 });
  }

  const isMaskable = _request.nextUrl.searchParams.get("maskable") === "1";
  const glyphSize = Math.round(dimension * (isMaskable ? 0.42 : 0.6));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#14120e",
        }}
      >
        <div
          style={{
            fontSize: glyphSize,
            fontWeight: 600,
            fontFamily: "serif",
            color: "#c9a25c",
          }}
        >
          C
        </div>
      </div>
    ),
    { width: dimension, height: dimension },
  );
}
