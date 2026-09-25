"use client";

/**
 * Dernier filet de sécurité, si la mise en page générale elle-même échoue.
 * Next.js n'y charge ni les styles ni les polices du site : tout est écrit
 * ici, aux couleurs « Marine & or ».
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 24,
          textAlign: "center",
          background: "#0e1a31",
          color: "#f4f1ea",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <title>Un imprévu est survenu</title>
        <h1 style={{ margin: 0, fontWeight: 400, fontSize: 40 }}>Un imprévu est survenu.</h1>
        <p style={{ margin: 0, maxWidth: 440, lineHeight: 1.6, color: "#aeb6c8", fontFamily: "system-ui, sans-serif" }}>
          Le site n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.
        </p>
        {error.digest && (
          <p style={{ margin: 0, fontSize: 12, color: "#8e98ae", fontFamily: "system-ui, sans-serif" }}>
            Référence : {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => retry()}
          style={{
            minHeight: 48,
            padding: "0 28px",
            border: "none",
            background: "#c9a24e",
            color: "#0e1a31",
            fontSize: 16,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
