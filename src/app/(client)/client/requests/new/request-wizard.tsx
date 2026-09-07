"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createRequest } from "@/server/requests/actions";
import type { CategoryOption } from "./page";

type WizardData = {
  categoryId: string;
  title: string;
  description: string;
  requestedDate: string;
  requestedTime: string;
  locationText: string;
  budgetMin: string;
  budgetMax: string;
  preferences: string;
};

const INITIAL_DATA: WizardData = {
  categoryId: "",
  title: "",
  description: "",
  requestedDate: "",
  requestedTime: "",
  locationText: "",
  budgetMin: "",
  budgetMax: "",
  preferences: "",
};

const STEP_LABELS = [
  "Catégorie",
  "Description",
  "Date & heure",
  "Lieu",
  "Budget",
  "Préférences",
  "Pièces jointes",
  "Confirmation",
];

export function RequestWizard({ categories }: { categories: CategoryOption[] }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [files, setFiles] = useState<File[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const selectedCategory = categories.find((c) => c.id === data.categoryId);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function validateStep(): boolean {
    if (step === 0 && !data.categoryId) {
      setStepError("Choisissez une catégorie pour continuer.");
      return false;
    }
    if (step === 1 && (data.title.trim().length < 3 || data.description.trim().length < 10)) {
      setStepError("Ajoutez un titre et une description un peu plus détaillée.");
      return false;
    }
    setStepError(null);
    return true;
  }

  function goNext() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("categoryId", data.categoryId);
    formData.set("title", data.title);
    formData.set("description", data.description);
    formData.set("requestedDate", data.requestedDate);
    formData.set("requestedTime", data.requestedTime);
    formData.set("locationText", data.locationText);
    formData.set("budgetMin", data.budgetMin);
    formData.set("budgetMax", data.budgetMax);
    formData.set("preferences", data.preferences);
    for (const file of files) {
      formData.append("attachments", file);
    }

    startTransition(async () => {
      const result = await createRequest(formData);
      // Si createRequest réussit, il redirige côté serveur et cette ligne
      // n'est jamais atteinte. Un retour signifie donc une erreur.
      if (result?.error) {
        setSubmitError(result.error);
        toast({ title: "Erreur", description: result.error, variant: "danger" });
      }
    });
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm font-medium text-fg-muted">
          Étape {step + 1} / {STEP_LABELS.length} — {STEP_LABELS[step]}
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-subtle">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">
            Que puis-je faire pour vous ?
          </h1>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => update("categoryId", category.id)}
                className={`rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                  data.categoryId === category.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-fg hover:bg-bg-subtle"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Décrivez votre demande</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex. Table pour deux vendredi soir"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Décrivez ce dont vous avez besoin, avec le plus de détails possible."
              rows={5}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Date et heure souhaitées</h1>
          <p className="text-sm text-fg-muted">Facultatif — laissez vide si vous n&apos;avez pas de contrainte.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <DatePicker
                id="date"
                value={data.requestedDate}
                onChange={(e) => update("requestedDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                type="time"
                value={data.requestedTime}
                onChange={(e) => update("requestedTime", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Lieu</h1>
          <p className="text-sm text-fg-muted">Facultatif.</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Adresse ou zone géographique</Label>
            <Input
              id="location"
              value={data.locationText}
              onChange={(e) => update("locationText", e.target.value)}
              placeholder="Ex. Paris 8e, ou une adresse précise"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Budget</h1>
          <p className="text-sm text-fg-muted">Facultatif — nous adapterons les propositions.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budgetMin">Minimum (€)</Label>
              <Input
                id="budgetMin"
                type="number"
                min={0}
                value={data.budgetMin}
                onChange={(e) => update("budgetMin", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budgetMax">Maximum (€)</Label>
              <Input
                id="budgetMax"
                type="number"
                min={0}
                value={data.budgetMax}
                onChange={(e) => update("budgetMax", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Préférences particulières</h1>
          <p className="text-sm text-fg-muted">
            Facultatif — allergies, préférences de placement, contraintes spécifiques...
          </p>
          <Textarea
            value={data.preferences}
            onChange={(e) => update("preferences", e.target.value)}
            rows={4}
          />
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Pièces jointes</h1>
          <p className="text-sm text-fg-muted">Facultatif — devis, inspiration, documents utiles.</p>
          <FileUpload maxSizeMb={10} onFilesChange={setFiles} />
        </div>
      )}

      {step === 7 && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-medium text-fg">Confirmez votre demande</h1>
          <dl className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Catégorie</dt>
              <dd className="text-right font-medium text-fg">
                {selectedCategory ? <Badge variant="accent">{selectedCategory.name}</Badge> : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Titre</dt>
              <dd className="text-right font-medium text-fg">{data.title || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Date</dt>
              <dd className="text-right text-fg">
                {data.requestedDate || "Non précisée"} {data.requestedTime}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Lieu</dt>
              <dd className="text-right text-fg">{data.locationText || "Non précisé"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Budget</dt>
              <dd className="text-right text-fg">
                {data.budgetMin || data.budgetMax
                  ? `${data.budgetMin || "0"}€ – ${data.budgetMax || "?"}€`
                  : "Non précisé"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Pièces jointes</dt>
              <dd className="text-right text-fg">{files.length}</dd>
            </div>
          </dl>
          {submitError && <p className="text-sm text-danger">{submitError}</p>}
        </div>
      )}

      {stepError && <p className="mt-3 text-sm text-danger">{stepError}</p>}

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={goBack} disabled={step === 0 || pending}>
          Précédent
        </Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button onClick={goNext}>Suivant</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Envoi..." : "Confirmer ma demande"}
          </Button>
        )}
      </div>
    </div>
  );
}
