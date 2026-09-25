"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { MessageCircle, SendHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { sendMessage, markThreadRead, type SendMessageState } from "@/server/messages/actions";
import { dateCourte, heure } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

const initialState: SendMessageState = { error: null };

// Heure de Paris des deux côtés : le rendu serveur (UTC) et le navigateur affichent la même chose.
function horodatage(iso: string): string {
  const jour = dateCourte(iso);
  return jour === dateCourte(new Date().toISOString()) ? heure(iso) : `${jour}, ${heure(iso)}`;
}

export function MessageThread({
  requestId,
  currentUserId,
  initialMessages,
  interlocuteur = "Votre interlocuteur",
}: {
  requestId: string;
  currentUserId: string;
  initialMessages: ThreadMessage[];
  /** Nom affiché au-dessus des messages reçus (« Votre concierge », « Le client »). */
  interlocuteur?: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const [brouillon, setBrouillon] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const filRef = useRef<HTMLDivElement>(null);
  const idChamp = useId();

  useEffect(() => {
    // Accusé de lecture au mieux : un échec (session expirée) ne doit rien casser.
    markThreadRead(requestId).catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
        (payload) => {
          const row = payload.new as ThreadMessage & { is_internal_note: boolean };
          if (row.is_internal_note) return;
          setMessages((current) =>
            current.some((m) => m.id === row.id) ? current : [...current, row],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  // Fait défiler le fil lui-même (et non la page) jusqu'au dernier message.
  useEffect(() => {
    const fil = filRef.current;
    if (fil) fil.scrollTop = fil.scrollHeight;
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={filRef}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        tabIndex={0}
        className="flex max-h-[28rem] min-h-40 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-bg-subtle p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5"
      >
        {messages.length === 0 && (
          <div className="m-auto flex flex-col items-center gap-2 py-6 text-center">
            <MessageCircle aria-hidden="true" className="h-6 w-6 text-fg-faint" strokeWidth={1.5} />
            <p className="text-sm text-fg-muted">Aucun message pour l&apos;instant. Posez votre question ci-dessous.</p>
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
              <span className="text-xs text-fg-faint">
                {isMine ? "Vous" : interlocuteur} · {horodatage(message.created_at)}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words",
                  isMine ? "rounded-br-sm bg-accent text-accent-fg" : "rounded-bl-sm border border-border bg-surface text-fg",
                )}
              >
                {message.body}
              </div>
            </div>
          );
        })}
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          setBrouillon("");
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="requestId" value={requestId} />
        <label htmlFor={idChamp} className="sr-only">
          Votre message
        </label>
        <div className="flex items-end gap-2 rounded-lg border border-border bg-surface p-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <textarea
            id={idChamp}
            name="body"
            value={brouillon}
            onChange={(e) => setBrouillon(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl+Entrée (ou Cmd+Entrée) envoie ; Entrée seule passe à la ligne.
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && brouillon.trim()) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="Écrire un message…"
            rows={2}
            aria-describedby={`${idChamp}-aide`}
            className="max-h-40 min-h-11 flex-1 resize-y bg-transparent px-2 py-2 text-base text-fg outline-none placeholder:text-fg-muted sm:text-sm"
          />
          <Button type="submit" disabled={pending || !brouillon.trim()} aria-label="Envoyer le message" className="shrink-0 px-4">
            <SendHorizontal aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </Button>
        </div>
        <p id={`${idChamp}-aide`} className="text-xs text-fg-faint">
          Ctrl + Entrée pour envoyer.
        </p>
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
