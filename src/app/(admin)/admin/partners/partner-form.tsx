"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { PartnerFormState } from "@/server/partners/actions";

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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" defaultValue={partner?.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Catégorie</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={partner?.categoryId ?? ""}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactName">Contact</Label>
          <Input id="contactName" name="contactName" defaultValue={partner?.contactName ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Statut</Label>
          <select
            id="status"
            name="status"
            defaultValue={partner?.status ?? "pending"}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={partner?.email ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={partner?.phone ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={partner?.address ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">Site web</Label>
          <Input id="website" name="website" defaultValue={partner?.website ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="commissionRate">Commission (%)</Label>
          <Input
            id="commissionRate"
            name="commissionRate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={partner?.commissionRate ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={partner?.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enregistrement..." : partner ? "Mettre à jour" : "Créer le partenaire"}
      </Button>
    </form>
  );
}
