"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addProposalOption, type AddOptionState } from "@/server/proposals/actions";

const initialState: AddOptionState = { error: null };

export function AddOptionForm({ proposalId }: { proposalId: string }) {
  const [state, formAction, pending] = useActionState(addProposalOption, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une option</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={async (formData) => {
            await formAction(formData);
            formRef.current?.reset();
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="proposalId" value={proposalId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" placeholder="Ex. Le Jardin Secret" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Prix (€)</Label>
              <Input id="price" name="price" type="number" min={0} step="0.01" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea id="conditions" name="conditions" rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="advantages">Avantages</Label>
              <Textarea id="advantages" name="advantages" rows={2} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photoUrls">Photos (URLs séparées par une virgule)</Label>
            <Input id="photoUrls" name="photoUrls" placeholder="https://..." />
          </div>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Ajout..." : "Ajouter cette option"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
