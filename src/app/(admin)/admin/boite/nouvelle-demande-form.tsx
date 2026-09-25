"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { creerDemande } from "@/server/agent/boite";
import type { FormState } from "@/server/agent/ft-admin";

const initialState: FormState = { error: null };

export function NouvelleDemandeForm({ logements }: { logements: { id: string; nom: string }[] }) {
  const [state, formAction, pending] = useActionState(creerDemande, initialState);
  const [activite, setActivite] = useState<"ft" | "premium" | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        <legend className="text-sm font-medium text-fg">Pour quelle activité ?</legend>
        <div className="flex gap-6 text-sm text-fg">
          {/* Aucune option cochée par défaut : l'activité se choisit à chaque fois, l'agent ne la devine pas. */}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="activite"
              value="ft"
              required
              checked={activite === "ft"}
              onChange={() => setActivite("ft")}
            />
            F&amp;T (location courte durée)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="activite"
              value="premium"
              required
              checked={activite === "premium"}
              onChange={() => setActivite("premium")}
            />
            Premium (abonnement particuliers)
          </label>
        </div>
      </fieldset>

      {activite === "ft" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="logementId">Logement concerné (facultatif)</Label>
          {logements.length > 0 ? (
            <>
              <select
                id="logementId"
                name="logementId"
                defaultValue=""
                disabled={pending}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
              >
                <option value="">Aucun : l&apos;assistant lira seulement la fiche générale</option>
                {logements.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nom}
                  </option>
                ))}
              </select>
              <p className="text-sm text-fg-muted">
                Seuls les logements activés sont proposés. L&apos;assistant lira aussi la fiche du logement choisi.
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              Aucun logement activé pour l&apos;instant : l&apos;assistant ne lira que la fiche générale. Créez et
              activez un logement dans « Fiches ».
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expediteur">De la part de (facultatif)</Label>
        <Input
          id="expediteur"
          name="expediteur"
          maxLength={100}
          placeholder="Ex. voyageuse du logement Rivoli, cliente Premium…"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message-recu">Message reçu</Label>
        <Textarea
          id="message-recu"
          name="contenu"
          rows={8}
          required
          placeholder="Collez ici le message tel que vous l'avez reçu."
          disabled={pending}
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Préparation en cours…" : "Préparer une réponse"}
        </Button>
        <p className="text-sm text-fg-muted">Rien n&apos;est envoyé : vous relisez avant de copier.</p>
      </div>
    </form>
  );
}
