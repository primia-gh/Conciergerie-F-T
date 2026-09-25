"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FileUpload } from "@/components/ui/file-upload";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { useToast } from "@/hooks/use-toast";
import { createRequest } from "@/server/requests/actions";
import { cn } from "@/lib/utils";
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

/** Quatre étapes : l'essentiel d'abord, les précisions facultatives ensuite. */
const ETAPES = ["Catégorie", "Votre demande", "Précisions", "Vérification"] as const;

const aide = "text-sm text-fg-muted";

export function RequestWizard({
  categories,
  categorieInitiale,
}: {
  categories: CategoryOption[];
  categorieInitiale?: string;
}) {
  // Catégorie choisie depuis le tableau de bord : on passe directement à la demande.
  const [step, setStep] = useState(categorieInitiale ? 1 : 0);
  const [data, setData] = useState<WizardData>({ ...INITIAL_DATA, categoryId: categorieInitiale ?? "" });
  const [files, setFiles] = useState<File[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const titreRef = useRef<HTMLHeadingElement>(null);
  const premierRendu = useRef(true);

  // À chaque changement d'étape, le focus va au titre : le lecteur d'écran
  // annonce la nouvelle étape, le clavier repart du haut du formulaire.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    titreRef.current?.focus();
  }, [step]);

  const selectedCategory = categories.find((c) => c.id === data.categoryId);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function erreurEtape(index: number): string | null {
    if (index === 0 && !data.categoryId) return "Choisissez une catégorie pour continuer.";
    if (index === 1) {
      if (data.title.trim().length < 3) return "Donnez un titre à votre demande (3 caractères au moins).";
      if (data.description.trim().length < 10) return "Décrivez votre besoin en quelques mots de plus.";
    }
    if (index === 2 && data.budgetMin && data.budgetMax && Number(data.budgetMin) > Number(data.budgetMax)) {
      return "Le budget minimum dépasse le budget maximum.";
    }
    return null;
  }

  function aller(cible: number) {
    // On ne saute jamais une étape obligatoire non remplie.
    for (let i = 0; i < cible; i++) {
      const erreur = erreurEtape(i);
      if (erreur) {
        setStepError(erreur);
        setStep(i);
        return;
      }
    }
    setStepError(null);
    setStep(cible);
  }

  function goNext() {
    const erreur = erreurEtape(step);
    if (erreur) {
      setStepError(erreur);
      return;
    }
    aller(Math.min(step + 1, ETAPES.length - 1));
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

  const titreEtape = "scroll-mt-24 font-display text-3xl text-fg outline-none sm:text-4xl";

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Nouvelle demande</p>

      <nav aria-label="Étapes de la demande" className="mt-5">
        <ol className="grid grid-cols-4 gap-2">
          {ETAPES.map((nom, i) => {
            const faite = i < step;
            const enCours = i === step;
            return (
              <li key={nom}>
                <button
                  type="button"
                  onClick={() => (i < step ? aller(i) : undefined)}
                  disabled={i >= step}
                  aria-current={enCours ? "step" : undefined}
                  className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1 rounded-full transition-colors", faite || enCours ? "bg-accent" : "bg-border")}
                  />
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs sm:text-sm",
                      enCours ? "font-medium text-fg" : faite ? "text-fg-muted group-hover:text-fg" : "text-fg-faint",
                    )}
                  >
                    {faite && <Check aria-hidden="true" className="h-3.5 w-3.5 text-accent" />}
                    <span className={cn(!enCours && "hidden sm:inline")}>{nom}</span>
                    <span className="sr-only">
                      {faite ? " (faite, revenir à cette étape)" : enCours ? " (étape en cours)" : " (à venir)"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-10">
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <h1 id="titre-categorie" ref={titreRef} tabIndex={-1} className={titreEtape}>
              Que pouvons-nous faire pour vous ?
            </h1>
            <p className={aide}>Choisissez la catégorie la plus proche. Votre concierge ajustera si besoin.</p>
            <div role="radiogroup" aria-labelledby="titre-categorie" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((category) => {
                const choisie = data.categoryId === category.id;
                return (
                  <label
                    key={category.id}
                    className={cn(
                      "flex min-h-24 cursor-pointer flex-col items-start justify-between gap-3 rounded-lg border p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                      choisie ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="categorie"
                      value={category.id}
                      checked={choisie}
                      onChange={() => {
                        update("categoryId", category.id);
                        setStepError(null);
                      }}
                      className="sr-only"
                    />
                    <IconeCategorie nom={category.icon} className={cn("h-6 w-6", choisie ? "text-accent" : "text-fg-muted")} />
                    <span className="text-sm font-medium text-fg">{category.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 ref={titreRef} tabIndex={-1} className={titreEtape}>
                Décrivez votre demande
              </h1>
              {selectedCategory && (
                <p className={cn(aide, "mt-3")}>
                  Catégorie : <span className="text-fg">{selectedCategory.name}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={data.title}
                maxLength={200}
                aria-invalid={!!stepError && data.title.trim().length < 3}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ex. Table pour deux vendredi soir"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                maxLength={4000}
                aria-describedby="aide-description"
                aria-invalid={!!stepError && data.description.trim().length < 10}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ce dont vous avez besoin, pour combien de personnes, ce qui compte pour vous…"
                rows={6}
              />
              <p id="aide-description" className="text-xs text-fg-muted">
                Plus votre description est précise, plus les propositions seront justes.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 ref={titreRef} tabIndex={-1} className={titreEtape}>
                Quelques précisions
              </h1>
              <p className={cn(aide, "mt-3")}>Tout est facultatif : laissez vide ce qui n&apos;a pas d&apos;importance.</p>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-semibold text-fg">Quand ?</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="date" className="font-normal text-fg-muted">
                    Date
                  </Label>
                  <DatePicker id="date" value={data.requestedDate} onChange={(e) => update("requestedDate", e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="time" className="font-normal text-fg-muted">
                    Heure
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={data.requestedTime}
                    onChange={(e) => update("requestedTime", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Où ?</Label>
              <Input
                id="location"
                value={data.locationText}
                maxLength={300}
                autoComplete="off"
                onChange={(e) => update("locationText", e.target.value)}
                placeholder="Ex. Paris 8e, ou une adresse précise"
              />
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-semibold text-fg">Budget</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="budgetMin" className="font-normal text-fg-muted">
                    Minimum (€)
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={data.budgetMin}
                    onChange={(e) => update("budgetMin", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="budgetMax" className="font-normal text-fg-muted">
                    Maximum (€)
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={data.budgetMax}
                    onChange={(e) => update("budgetMax", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="preferences">Préférences particulières</Label>
              <Textarea
                id="preferences"
                value={data.preferences}
                maxLength={2000}
                onChange={(e) => update("preferences", e.target.value)}
                placeholder="Allergies, placement, accessibilité, contraintes…"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-fg">Pièces jointes</p>
              <p className="text-xs text-fg-muted">Devis, inspiration, documents utiles.</p>
              <FileUpload maxSizeMb={10} initialFiles={files} onFilesChange={setFiles} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 ref={titreRef} tabIndex={-1} className={titreEtape}>
                Vérifiez et envoyez
              </h1>
              <p className={cn(aide, "mt-3")}>Un concierge prend votre demande en charge et vous répond dans votre espace.</p>
            </div>
            <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
              <Recap libelle="Catégorie" valeur={selectedCategory?.name ?? "—"} modifier={() => aller(0)} />
              <Recap
                libelle="Demande"
                valeur={
                  <>
                    <span className="block font-medium text-fg">{data.title}</span>
                    <span className="mt-1 block whitespace-pre-line text-fg-muted">{data.description}</span>
                  </>
                }
                modifier={() => aller(1)}
              />
              <Recap
                libelle="Date"
                valeur={
                  data.requestedDate
                    ? `${new Date(`${data.requestedDate}T00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${data.requestedTime ? ` à ${data.requestedTime}` : ""}`
                    : "Non précisée"
                }
                modifier={() => aller(2)}
              />
              <Recap libelle="Lieu" valeur={data.locationText || "Non précisé"} modifier={() => aller(2)} />
              <Recap
                libelle="Budget"
                valeur={
                  data.budgetMin || data.budgetMax
                    ? data.budgetMin && data.budgetMax
                      ? `${data.budgetMin} € à ${data.budgetMax} €`
                      : data.budgetMax
                        ? `Jusqu'à ${data.budgetMax} €`
                        : `À partir de ${data.budgetMin} €`
                    : "Non précisé"
                }
                modifier={() => aller(2)}
              />
              {data.preferences && <Recap libelle="Préférences" valeur={data.preferences} modifier={() => aller(2)} />}
              <Recap
                libelle="Pièces jointes"
                valeur={files.length === 0 ? "Aucune" : files.map((f) => f.name).join(", ")}
                modifier={() => aller(2)}
              />
            </dl>
            {submitError && (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {submitError}
              </p>
            )}
          </div>
        )}
      </div>

      {stepError && (
        <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {stepError}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {step > 0 ? (
          <Button variant="ghost" onClick={goBack} disabled={pending}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Précédent
          </Button>
        ) : (
          <span />
        )}
        {step < ETAPES.length - 1 ? (
          <Button size="lg" onClick={goNext}>
            Continuer
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={handleSubmit} disabled={pending} aria-busy={pending}>
            {pending ? "Envoi…" : "Envoyer ma demande"}
            {!pending && <Check aria-hidden="true" className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function Recap({ libelle, valeur, modifier }: { libelle: string; valeur: React.ReactNode; modifier: () => void }) {
  return (
    <div className="flex gap-4 px-5 py-4 text-sm">
      <dt className="w-28 shrink-0 text-fg-muted">{libelle}</dt>
      <dd className="min-w-0 flex-1 break-words text-fg">{valeur}</dd>
      <dd className="shrink-0">
        <button
          type="button"
          onClick={modifier}
          className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Pencil aria-hidden="true" className="h-3 w-3" />
          Modifier<span className="sr-only"> : {libelle}</span>
        </button>
      </dd>
    </div>
  );
}
