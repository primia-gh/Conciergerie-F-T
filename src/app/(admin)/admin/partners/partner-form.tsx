"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { STATUT_PARTENAIRE } from "@/components/espace/libelles";
import type { PartnerFormState } from "@/server/partners/actions";
import { envoyerSansVider } from "@/hooks/envoyer-sans-vider";

export type PartnerFormValues = {
  name: string;
  categoryId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  commissionRate: string | null;
  status: string;
  notes: string | null;
};

const initialState: PartnerFormState = { error: null };

const facultatif = <span className="font-normal text-fg-muted">(facultatif)</span>;

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  const id = `groupe-${titre.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <h2 id={id} className="font-display text-xl text-fg">
        {titre}
      </h2>
      {children}
    </div>
  );
}

export function PartnerForm({
  categories,
  partner,
  action,
}: {
  categories: { id: string; name: string }[];
  partner?: PartnerFormValues;
  action: (prevState: PartnerFormState, formData: FormData) => Promise<PartnerFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    // En cas de succès, l'action redirige vers la liste ; en cas d'erreur, la saisie reste.
    <form onSubmit={envoyerSansVider(formAction)} className="flex flex-col gap-6">
      <Groupe titre="Le partenaire">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={partner?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">Catégorie {facultatif}</Label>
            <NativeSelect id="categoryId" name="categoryId" defaultValue={partner?.categoryId ?? ""}>
              <option value="">Aucune</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Statut</Label>
            <NativeSelect id="status" name="status" defaultValue={partner?.status ?? "pending"}>
              {(["active", "pending", "inactive"] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUT_PARTENAIRE[s].libelle}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commissionRate">Commission (%) {facultatif}</Label>
            <Input
              id="commissionRate"
              name="commissionRate"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              defaultValue={partner?.commissionRate ?? ""}
            />
          </div>
        </div>
      </Groupe>

      <Groupe titre="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactName">Personne à contacter {facultatif}</Label>
            <Input id="contactName" name="contactName" autoComplete="off" defaultValue={partner?.contactName ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Téléphone {facultatif}</Label>
            <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={partner?.phone ?? ""} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail {facultatif}</Label>
            <Input id="email" name="email" type="email" inputMode="email" defaultValue={partner?.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Site web {facultatif}</Label>
            <Input id="website" name="website" inputMode="url" defaultValue={partner?.website ?? ""} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Adresse {facultatif}</Label>
          <Input id="address" name="address" defaultValue={partner?.address ?? ""} />
        </div>
      </Groupe>

      <Groupe titre="Notes">
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes" className="sr-only">
            Notes
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={partner?.notes ?? ""}
            placeholder="Conditions négociées, interlocuteurs, remarques…"
            aria-describedby="aide-notes"
          />
          <p id="aide-notes" className="text-xs text-fg-muted">
            Visibles de vous et des concierges, et du partenaire lui-même s&apos;il a un compte. Jamais des clients.
          </p>
        </div>
      </Groupe>

      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="self-start">
        {pending ? "Enregistrement…" : partner ? "Enregistrer les modifications" : "Créer le partenaire"}
      </Button>
    </form>
  );
}
