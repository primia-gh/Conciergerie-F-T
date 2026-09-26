import { CalendarClock, Home, Mail, MessageSquare, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { LienRetour, PAGE, TitreSection, surtitre } from "@/components/espace/en-tete";
import {
  AUTEUR_MESSAGE_AGENT,
  STATUT_MESSAGE_AGENT,
  STATUT_PROPRIETAIRE,
  libelle,
} from "@/components/espace/libelles";
import { dateCourte, dateLongue, heure } from "@/lib/dates";
import { changerStatutProprietaire } from "@/server/agent/ft-admin";
import { cn } from "@/lib/utils";

export type DonneesProspect = {
  bien: {
    id: string;
    type: string | null;
    adresse: string | null;
    residence_principale: boolean | null;
    capacite: number | null;
    equipements: string[] | null;
    disponibilite_souhaitee: string | null;
    created_at: string;
  };
  proprietaire: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string | null;
    statut: string;
    source: string | null;
    notes: string | null;
  };
  messages: { id: string; canal: string; contenu: string; auteur: string; statut: string; created_at: string }[];
  rendezVous: { id: string; creneau: string; canal: string | null; statut: string }[];
};

const STATUTS = ["prospect", "en_discussion", "client", "perdu"] as const;

function Info({ libelle: l, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{l}</dt>
      <dd className="mt-0.5 text-sm break-words text-fg">{children}</dd>
    </div>
  );
}

/** Fiche d'un propriétaire prospect F&T (présentation seule : les données viennent de page.tsx). */
export function VueProspect({ d }: { d: DonneesProspect }) {
  const { bien, proprietaire: p } = d;
  const s = libelle(STATUT_PROPRIETAIRE, p.statut);
  const tel = p.telephone?.replace(/[^+0-9]/g, "");
  const formulaire = p.source === "formulaire_estimation";

  return (
    <div className={PAGE.moyenne}>
      <LienRetour href="/admin/ft">Prospects F&amp;T</LienRetour>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={cn(surtitre, "text-accent")}>
            {formulaire ? "Demande d'estimation" : p.source === "chat_site" ? "Chat du site" : "Prospect"} ·{" "}
            {dateCourte(bien.created_at)}
          </p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg">{p.nom}</h1>
          {formulaire && (
            <p className="mt-3 text-sm text-fg-muted">
              Rappel promis sous 24 h : demande reçue le {dateLongue(bien.created_at)} à {heure(bien.created_at)}.
            </p>
          )}
        </div>
        <Badge variant={s.variante} className="self-start px-3 py-1 text-sm sm:self-auto">
          {s.libelle}
        </Badge>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        {tel && (
          <a
            href={`tel:${tel}`}
            className="inline-flex min-h-12 items-center gap-2 bg-accent px-5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Phone aria-hidden="true" className="h-4 w-4" /> Appeler {p.telephone}
          </a>
        )}
        {p.email && (
          <a
            href={`mailto:${p.email}`}
            className="inline-flex min-h-12 items-center gap-2 border border-border px-5 text-sm text-fg transition-colors hover:bg-surface"
          >
            <Mail aria-hidden="true" className="h-4 w-4 text-accent" /> Écrire à {p.email}
          </a>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-2">
          <section aria-labelledby="titre-bien" className="rounded-lg border border-border bg-surface p-6">
            <h2 id="titre-bien" className="flex items-center gap-2 font-display text-xl text-fg">
              <Home aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> Le logement
            </h2>
            <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info libelle="Type">{bien.type ?? "Non précisé"}</Info>
              <Info libelle="Ville ou adresse">{bien.adresse ?? "Non précisée"}</Info>
              <Info libelle="Couchages">{bien.capacite ?? "Non précisé"}</Info>
              <Info libelle="Résidence">
                {bien.residence_principale === null
                  ? "Non précisé"
                  : bien.residence_principale
                    ? "Principale"
                    : "Secondaire"}
              </Info>
              <Info libelle="Équipements">{bien.equipements?.join(", ") || "Non précisés"}</Info>
              <Info libelle="Disponibilité souhaitée">{bien.disponibilite_souhaitee ?? "Non précisée"}</Info>
            </dl>
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs text-fg-muted">Message du propriétaire</p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-fg">{p.notes ?? "Aucun message."}</p>
            </div>
          </section>

          <section aria-labelledby="titre-conversation">
            <TitreSection id="titre-conversation" className="gap-2">
              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
              Conversation
            </TitreSection>
            {d.messages.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">
                {formulaire ? "Pas d'échange écrit : ce propriétaire a rempli le formulaire." : "Aucun échange pour l'instant."}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-bg-subtle p-4 sm:p-5">
                {d.messages.map((m) => {
                  const agent = m.auteur === "agent";
                  return (
                    <div key={m.id} className={cn("flex flex-col gap-1", agent ? "items-start" : "items-end")}>
                      <span className="text-xs text-fg-faint">
                        {AUTEUR_MESSAGE_AGENT[m.auteur] ?? m.auteur} · {dateCourte(m.created_at)}, {heure(m.created_at)}
                        {agent && ` · ${STATUT_MESSAGE_AGENT[m.statut] ?? m.statut}`}
                      </span>
                      <p
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                          agent ? "rounded-bl-sm border border-border bg-surface text-fg" : "rounded-br-sm bg-accent/15 text-fg",
                        )}
                      >
                        {m.contenu}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-5" aria-label="Suivi du prospect">
          <section aria-labelledby="titre-statut" className="rounded-lg border border-accent/60 bg-surface p-5">
            <h2 id="titre-statut" className="font-display text-xl text-fg">
              Où en êtes-vous ?
            </h2>
            {/* Clé liée au statut : le formulaire repart de la valeur enregistrée après chaque changement. */}
            <form
              key={p.statut}
              action={changerStatutProprietaire.bind(null, p.id, bien.id)}
              className="mt-4 flex flex-col gap-3"
            >
              <label htmlFor="statut" className="sr-only">
                Statut du propriétaire
              </label>
              <NativeSelect id="statut" name="statut" defaultValue={p.statut}>
                {STATUTS.map((st) => (
                  <option key={st} value={st}>
                    {STATUT_PROPRIETAIRE[st].libelle}
                  </option>
                ))}
              </NativeSelect>
              <Button type="submit" variant="secondary">
                Enregistrer le statut
              </Button>
              <p className="text-xs text-fg-muted">Chaque changement est écrit dans le journal.</p>
            </form>
          </section>

          <section aria-labelledby="titre-rdv" className="rounded-lg border border-border bg-surface p-5">
            <h2 id="titre-rdv" className="flex items-center gap-2 font-display text-xl text-fg">
              <CalendarClock aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> Rendez-vous
            </h2>
            {d.rendezVous.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">Aucun rendez-vous pris.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {d.rendezVous.map((rdv) => (
                  <li key={rdv.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-fg first-letter:uppercase">
                      {dateLongue(rdv.creneau)} à {heure(rdv.creneau)}
                    </span>
                    <Badge variant="accent">{rdv.statut === "propose" ? "Proposé" : rdv.statut}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
