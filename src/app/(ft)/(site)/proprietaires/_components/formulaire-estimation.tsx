"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { demanderEstimation, type EstimationState } from "@/server/agent/estimation";

const initial: EstimationState = { statut: "initial" };

const champ =
  "h-12 w-full rounded-md border border-border bg-bg px-4 text-base text-fg placeholder:text-fg-faint outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const libelle = "text-sm font-semibold text-fg";

/** Formulaire « Estimer mes revenus » : court, sans jargon, erreurs annoncées. */
export function FormulaireEstimation() {
  const [state, action, enCours] = useActionState(demanderEstimation, initial);
  // Heure d'affichage, posée après le chargement (voir le délai minimum côté serveur).
  const debutRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (debutRef.current) debutRef.current.value = String(Date.now());
  }, []);
  const v = state.champs ?? {};

  if (state.statut === "envoye") {
    return (
      <div role="status" className="flex flex-col items-start gap-5 rounded-2xl bg-surface p-8 ring-1 ring-filet">
        <CheckCircle2 aria-hidden="true" strokeWidth={1.25} className="h-12 w-12 text-accent" />
        <h3 className="font-display text-3xl font-light">Merci, c&apos;est bien reçu.</h3>
        <p className="text-lg leading-relaxed text-fg-muted">
          Nous vous rappelons sous 24 h au numéro indiqué, pour parler de votre logement et convenir
          d&apos;une visite.
        </p>
        <Link href="/location" className="border-b border-accent pb-1 text-fg transition-colors hover:text-accent">
          Retour à l&apos;accueil F&amp;T
        </Link>
      </div>
    );
  }

  return (
    <form key={state.tentative ?? 0} action={action} className="flex flex-col gap-6 rounded-2xl bg-surface p-6 ring-1 ring-filet sm:p-8" noValidate>
      {state.statut === "erreur" && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.erreur}
        </p>
      )}
      {/* Champ piège : invisible pour un humain, rempli par les robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site_web">Laissez ce champ vide</label>
        <input id="site_web" name="site_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={debutRef} type="hidden" name="debut" defaultValue="" />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="nom" className={libelle}>
            Nom <span className="text-accent">*</span>
          </label>
          <input id="nom" name="nom" required autoComplete="name" defaultValue={v.nom} className={champ} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="telephone" className={libelle}>
            Téléphone <span className="text-accent">*</span>
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            defaultValue={v.telephone}
            className={champ}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="email" className={libelle}>
            E-mail <span className="font-normal text-fg-muted">(facultatif)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={v.email}
            className={champ}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ville" className={libelle}>
            Ville du logement <span className="text-accent">*</span>
          </label>
          <input id="ville" name="ville" required autoComplete="address-level2" defaultValue={v.ville} className={champ} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="type" className={libelle}>
            Type de logement <span className="text-accent">*</span>
          </label>
          <select id="type" name="type" required defaultValue={v.type ?? ""} className={champ}>
            <option value="" disabled>
              Choisir…
            </option>
            <option>Appartement</option>
            <option>Maison</option>
            <option>Studio</option>
            <option>Autre</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="couchages" className={libelle}>
            Nombre de couchages
          </label>
          <input
            id="couchages"
            name="couchages"
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            defaultValue={v.couchages}
            className={champ}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${libelle} mb-2`}>Il s&apos;agit de votre…</legend>
          <div className="flex gap-3">
            {[
              ["secondaire", "Résidence secondaire"],
              ["principale", "Résidence principale"],
            ].map(([valeur, texte]) => (
              <label
                key={valeur}
                className="flex min-h-12 flex-1 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm has-checked:border-accent has-checked:bg-accent/10"
              >
                <input type="radio" name="residence" value={valeur} defaultChecked={v.residence === valeur} className="accent-[#e3a07a]" />
                {texte}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="message" className={libelle}>
            Un mot sur votre logement <span className="font-normal text-fg-muted">(facultatif)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            maxLength={2000}
            defaultValue={v.message}
            className={`${champ} h-auto py-3`}
            placeholder="Disponibilités pour vous rappeler, particularités du logement…"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-fg-muted">
        <input type="checkbox" name="consentement" value="oui" required className="mt-1 h-4 w-4 shrink-0 accent-[#e3a07a]" />
        <span>
          J&apos;accepte que Conciergerie F&amp;T utilise ces informations pour me recontacter au sujet de mon
          logement (voir la{" "}
          <Link href="/confidentialite" className="text-fg underline underline-offset-2">
            politique de confidentialité
          </Link>
          ).
        </span>
      </label>

      <button
        type="submit"
        disabled={enCours}
        aria-busy={enCours}
        className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-brand px-8 text-base font-bold text-brand-fg transition-colors hover:bg-[#e6dccb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70"
      >
        {enCours ? "Envoi…" : "Recevoir mon estimation"}
        {!enCours && (
          <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
        )}
      </button>
      <p className="text-center text-xs text-fg-muted">
        Votre demande ne vous engage à rien. Nous vous rappelons sous 24 h.
      </p>
    </form>
  );
}
