"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { envoyerSansVider } from "@/hooks/envoyer-sans-vider";
import { creerDemande } from "@/server/agent/boite";
import type { FormState } from "@/server/agent/ft-admin";
import { cn } from "@/lib/utils";

const initialState: FormState = { error: null };

const ACTIVITES = [
  { valeur: "ft", titre: "F&T", detail: "Location courte durée" },
  { valeur: "premium", titre: "Premium", detail: "Abonnement particuliers" },
] as const;

export function NouvelleDemandeForm({ logements }: { logements: { id: string; nom: string }[] }) {
  const [state, formAction, pending] = useActionState(creerDemande, initialState);
  const [activite, setActivite] = useState<"ft" | "premium" | null>(null);

  return (
    // Succès : l'action ouvre le brouillon. Erreur : le message collé reste là.
    <form onSubmit={envoyerSansVider(formAction)} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        <legend className="mb-2 text-sm font-medium text-fg">Pour quelle activité ?</legend>
        {/* Aucune option cochée par défaut : l'activité se choisit à chaque fois, l'agent ne la devine pas. */}
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITES.map((a) => (
            <label
              key={a.valeur}
              className={cn(
                "flex min-h-16 cursor-pointer flex-col justify-center rounded-lg border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                activite === a.valeur ? "border-accent bg-accent/10" : "border-border hover:border-accent/50",
              )}
            >
              <input
                type="radio"
                name="activite"
                value={a.valeur}
                required
                checked={activite === a.valeur}
                onChange={() => setActivite(a.valeur)}
                className="sr-only"
              />
              <span className="font-medium text-fg">{a.titre}</span>
              <span className="text-xs text-fg-muted">{a.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {activite === "ft" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="logementId">Logement concerné (facultatif)</Label>
          {logements.length > 0 ? (
            <>
              <NativeSelect id="logementId" name="logementId" defaultValue="" disabled={pending}>
                <option value="">Aucun : l&apos;assistant lira seulement la fiche générale</option>
                {logements.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nom}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-fg-muted">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="expediteur">De la part de (facultatif)</Label>
        <Input
          id="expediteur"
          name="expediteur"
          maxLength={100}
          placeholder="Ex. voyageuse du logement Rivoli, cliente Premium…"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-2">
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

      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {pending ? "Préparation en cours… (quelques secondes)" : "Préparer une réponse"}
        </Button>
        <p className="text-xs text-fg-muted">Rien n&apos;est envoyé : vous relisez avant de copier.</p>
      </div>
    </form>
  );
}
