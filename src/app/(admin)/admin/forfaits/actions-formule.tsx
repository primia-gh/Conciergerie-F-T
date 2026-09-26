"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { FORFAITS, forfait } from "@/lib/forfaits";
import { activerForfait, ignorerDemandeForfait } from "@/server/subscriptions/actions";

/** Activer la formule demandée ou clore la demande : chaque geste est confirmé puis journalisé. */
export function ActionsDemande({ clientId, code, nomClient }: { clientId: string; code: string; nomClient: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmer, setConfirmer] = useState<"activer" | "ignorer" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const nom = forfait(code)?.nom ?? code;

  function lancer(geste: "activer" | "ignorer") {
    startTransition(async () => {
      const r = geste === "activer" ? await activerForfait(clientId, code) : await ignorerDemandeForfait(clientId);
      setErreur(r.error);
      setConfirmer(null);
    });
  }

  if (confirmer) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg">
          {confirmer === "activer"
            ? `Activer ${nom} pour ${nomClient} ? Pensez à convenir de la facturation.`
            : `Clore la demande de ${nomClient} sans changer sa formule ?`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} aria-busy={pending} onClick={() => lancer(confirmer)}>
            {pending ? "Un instant…" : confirmer === "activer" ? `Oui, activer ${nom}` : "Oui, clore"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmer(null)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setConfirmer("activer")}>
          Activer {nom}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmer("ignorer")}>
          Clore sans changer
        </Button>
      </div>
      {erreur && (
        <p role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Changer la formule d'un client sans demande de sa part (geste commercial, retour à Free…). */
export function ChangerFormule({ clientId, actuelle, nomClient }: { clientId: string; actuelle: string; nomClient: string }) {
  const [pending, startTransition] = useTransition();
  const [choix, setChoix] = useState(actuelle);
  const [confirmer, setConfirmer] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const nom = forfait(choix)?.nom ?? choix;

  if (confirmer) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg">
          Passer {nomClient} en {nom} ?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            aria-busy={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await activerForfait(clientId, choix);
                setErreur(r.error);
                setConfirmer(false);
              })
            }
          >
            {pending ? "Un instant…" : "Confirmer"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmer(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor={`formule-${clientId}`} className="sr-only">
          Formule de {nomClient}
        </label>
        <NativeSelect id={`formule-${clientId}`} value={choix} onChange={(e) => setChoix(e.target.value)} className="min-w-32 flex-1">
          {FORFAITS.map((f) => (
            <option key={f.code} value={f.code}>
              {f.nom}
            </option>
          ))}
        </NativeSelect>
        <Button size="md" variant="secondary" disabled={choix === actuelle} onClick={() => setConfirmer(true)}>
          Changer
        </Button>
      </div>
      {erreur && (
        <p role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
