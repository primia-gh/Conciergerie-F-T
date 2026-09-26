"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { addProposalOption, type AddOptionState } from "@/server/proposals/actions";

const initialState: AddOptionState = { error: null };

export type PartnerOption = { id: string; name: string };

const facultatif = <span className="font-normal text-fg-muted">(facultatif)</span>;

export function AddOptionForm({
  proposalId,
  partners,
}: {
  proposalId: string;
  partners: PartnerOption[];
}) {
  const [state, formAction, pending] = useActionState(addProposalOption, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Vide le formulaire seulement quand l'option est bien ajoutée : en cas
  // d'erreur, la saisie reste là pour être corrigée.
  useEffect(() => {
    if (state !== initialState && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="proposalId" value={proposalId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" placeholder="Ex. Le Jardin Secret" required minLength={2} maxLength={200} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Prix (€)</Label>
          <Input id="price" name="price" type="number" inputMode="decimal" min={0} step="0.01" required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description {facultatif}</Label>
        <Textarea id="description" name="description" rows={3} maxLength={2000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Adresse {facultatif}</Label>
          <Input id="address" name="address" maxLength={300} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="partnerId">Partenaire {facultatif}</Label>
          <NativeSelect id="partnerId" name="partnerId" defaultValue="">
            <option value="">Aucun</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="advantages">Avantages {facultatif}</Label>
        <Textarea
          id="advantages"
          name="advantages"
          rows={2}
          maxLength={1000}
          aria-describedby="aide-avantages"
          placeholder={"Terrasse au calme\nMenu végétarien sur demande"}
        />
        <p id="aide-avantages" className="text-xs text-fg-muted">
          Un avantage par ligne : le client les voit sous forme de liste.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="conditions">Conditions {facultatif}</Label>
        <Textarea id="conditions" name="conditions" rows={2} maxLength={1000} placeholder="Annulation, acompte…" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="photoUrls">Photos {facultatif}</Label>
        <Input id="photoUrls" name="photoUrls" placeholder="https://…" aria-describedby="aide-photos" />
        <p id="aide-photos" className="text-xs text-fg-muted">
          Adresses web des photos, séparées par une virgule.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        <Plus aria-hidden="true" className="h-4 w-4" />
        {pending ? "Ajout…" : "Ajouter cette option"}
      </Button>
    </form>
  );
}
