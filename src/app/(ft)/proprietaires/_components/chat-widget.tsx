"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { envoyerMessageProprietaire } from "@/server/agent/chat";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "ft-bien-prospect-id";

const MESSAGE_ACCUEIL: Message = {
  role: "assistant",
  content:
    "Bonjour, je suis l'assistant de Conciergerie F&T. Vous êtes propriétaire d'un bien et vous souhaitez en savoir plus sur notre offre de gestion ? Dites-m'en un peu plus, je réponds à vos questions.",
};

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([MESSAGE_ACCUEIL]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [bienProspectId, setBienProspectId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  });
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyer() {
    const message = saisie.trim();
    if (!message || enCours) return;

    setMessages((m) => [...m, { role: "user", content: message }]);
    setSaisie("");
    setEnCours(true);
    setErreur(null);

    try {
      const resultat = await envoyerMessageProprietaire({ message, bienProspectId });

      if (!resultat.ok) {
        setErreur(resultat.error);
        return;
      }

      if (!bienProspectId) {
        setBienProspectId(resultat.bienProspectId);
        sessionStorage.setItem(STORAGE_KEY, resultat.bienProspectId);
      }
      setMessages((m) => [...m, { role: "assistant", content: resultat.reponse }]);
    } catch {
      setErreur("Une erreur est survenue, merci de réessayer.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-sm border border-border bg-surface">
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "assistant"
                ? "self-start rounded-sm bg-bg-subtle px-3 py-2 text-sm text-fg"
                : "self-end rounded-sm bg-accent px-3 py-2 text-sm text-accent-fg"
            }
          >
            {m.content}
          </div>
        ))}
        {enCours && (
          <div className="self-start rounded-sm bg-bg-subtle px-3 py-2 text-sm text-fg-muted">
            L&rsquo;assistant écrit…
          </div>
        )}
        <div ref={finRef} />
      </div>
      {erreur && <p className="border-t border-border px-4 py-2 text-sm text-danger">{erreur}</p>}
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer();
        }}
      >
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Écrivez votre message…"
          className="h-10 flex-1 rounded-sm border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
          disabled={enCours}
        />
        <Button type="submit" disabled={enCours || saisie.trim().length === 0}>
          Envoyer
        </Button>
      </form>
    </div>
  );
}
