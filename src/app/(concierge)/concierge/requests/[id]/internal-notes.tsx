"use client";

import { useActionState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addInternalNote, type AddNoteState } from "@/server/messages/actions";

export type NoteRow = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
};

const initialState: AddNoteState = { error: null };

export function InternalNotes({ requestId, notes }: { requestId: string; notes: NoteRow[] }) {
  const [state, formAction, pending] = useActionState(addInternalNote, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {notes.length === 0 && <p className="text-sm text-fg-muted">Aucune note pour l&apos;instant.</p>}
        {notes.map((note) => (
          <li key={note.id} className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
            <p className="text-fg">{note.body}</p>
            <p className="mt-1 text-xs text-fg-muted">
              {new Date(note.created_at).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>

      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="requestId" value={requestId} />
        <Textarea name="body" placeholder="Ajouter une note interne (visible concierge/admin uniquement)" rows={3} />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="self-start">
          {pending ? "Ajout..." : "Ajouter la note"}
        </Button>
      </form>
    </div>
  );
}
