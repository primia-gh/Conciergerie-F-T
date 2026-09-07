"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendMessage, markThreadRead, type SendMessageState } from "@/server/messages/actions";
import { cn } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

const initialState: SendMessageState = { error: null };

export function MessageThread({
  requestId,
  currentUserId,
  initialMessages,
}: {
  requestId: string;
  currentUserId: string;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void markThreadRead(requestId);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-bg-subtle/40 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-fg-muted">Aucun message pour l&apos;instant.</p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  isMine ? "bg-accent text-accent-fg" : "border border-border bg-surface text-fg",
                )}
              >
                {message.body}
              </div>
              <span className="mt-1 text-xs text-fg-muted">
                {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="requestId" value={requestId} />
        <div className="flex gap-2">
          <Textarea name="body" placeholder="Écrire un message..." rows={2} className="flex-1" />
          <Button type="submit" disabled={pending} className="self-end">
            Envoyer
          </Button>
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
      </form>
    </div>
  );
}
