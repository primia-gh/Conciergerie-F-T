"use client";

import { useActionState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addInternalNote, type AddNoteState } from "@/server/messages/actions";
import { dateCourte, heure } from "@/lib/dates";

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

  // Vide le champ seulement quand la note est bien enregistrée : en cas
  // d'erreur, le texte saisi reste là.
  useEffect(() => {
    if (state !== initialState && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      {notes.length === 0 ? (
        <p className="text-sm text-fg-muted">Aucune note pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
              <p className="leading-relaxed whitespace-pre-line text-fg">{note.body}</p>
              <p className="mt-1.5 text-xs text-fg-faint">
                {dateCourte(note.created_at)} à {heure(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <label htmlFor={`note-${requestId}`} className="sr-only">
          Nouvelle note interne
        </label>
        <Textarea id={`note-${requestId}`} name="body" placeholder="Ajouter une note interne…" rows={3} />
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="self-start">
          {pending ? "Ajout…" : "Ajouter la note"}
        </Button>
      </form>
    </div>
  );
}
