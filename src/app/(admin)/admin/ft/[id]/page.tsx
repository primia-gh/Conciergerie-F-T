import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { changerStatutProprietaire } from "@/server/agent/ft-admin";

type MessageRow = {
  id: string;
  canal: string;
  sens: string;
  contenu: string;
  auteur: string;
  statut: string;
  created_at: string;
};

type RendezVousRow = { id: string; creneau: string; canal: string | null; statut: string };

const STATUTS = ["prospect", "en_discussion", "client", "perdu"] as const;

export default async function AdminFtProspectDetailPage({ params }: PageProps<"/admin/ft/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bienProspect } = await supabase
    .from("bien_prospect")
    .select(
      "id, type, adresse, residence_principale, capacite, equipements, disponibilite_souhaitee, proprietaire:proprietaire_id(id, nom, email, telephone, statut, source)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!bienProspect || !bienProspect.proprietaire) {
    notFound();
  }
  const proprietaire = Array.isArray(bienProspect.proprietaire)
    ? bienProspect.proprietaire[0]
    : bienProspect.proprietaire;
  if (!proprietaire) notFound();

  const [{ data: messages }, { data: rendezVous }] = await Promise.all([
    supabase
      .from("message_agent")
      .select("id, canal, sens, contenu, auteur, statut, created_at")
      .eq("bien_prospect_id", id)
      .order("created_at", { ascending: true })
      .returns<MessageRow[]>(),
    supabase
      .from("rendez_vous")
      .select("id, creneau, canal, statut")
      .eq("bien_prospect_id", id)
      .order("creneau", { ascending: true })
      .returns<RendezVousRow[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/ft" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux prospects
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-fg">{proprietaire.nom}</h1>
        <form
          action={changerStatutProprietaire.bind(null, proprietaire.id, bienProspect.id)}
          className="flex items-center gap-2"
        >
          <select
            name="statut"
            defaultValue={proprietaire.statut}
            className="h-9 rounded-sm border border-border bg-bg px-2 text-sm text-fg"
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-fg hover:bg-bg-subtle"
          >
            Mettre à jour
          </button>
        </form>
      </div>

      <Card className="mt-6">
        <CardContent className="grid grid-cols-2 gap-4 pt-5 text-sm">
          <div>
            <p className="text-fg-muted">Contact</p>
            <p className="text-fg">{proprietaire.email ?? "—"}</p>
            <p className="text-fg">{proprietaire.telephone ?? "—"}</p>
          </div>
          <div>
            <p className="text-fg-muted">Bien</p>
            <p className="text-fg">
              {bienProspect.type ?? "Type non précisé"} · {bienProspect.adresse ?? "Adresse non précisée"}
            </p>
            <p className="text-fg">
              {bienProspect.capacite ? `${bienProspect.capacite} personnes` : "Capacité non précisée"}
              {bienProspect.residence_principale !== null
                ? ` · ${bienProspect.residence_principale ? "résidence principale" : "résidence secondaire"}`
                : ""}
            </p>
          </div>
          <div>
            <p className="text-fg-muted">Équipements</p>
            <p className="text-fg">{bienProspect.equipements?.join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-fg-muted">Disponibilité souhaitée</p>
            <p className="text-fg">{bienProspect.disponibilite_souhaitee ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {rendezVous && rendezVous.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-medium text-fg">Rendez-vous</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {rendezVous.map((rdv) => (
              <li key={rdv.id} className="flex items-center justify-between rounded-sm border border-border bg-surface px-4 py-2 text-sm">
                <span className="text-fg">{new Date(rdv.creneau).toLocaleString("fr-FR")}</span>
                <Badge variant="accent">{rdv.statut}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-fg">Conversation</h2>
        <div className="mt-3 flex flex-col gap-3">
          {(messages ?? []).map((m) => (
            <div
              key={m.id}
              className={
                m.auteur === "agent"
                  ? "self-start max-w-[85%] rounded-sm bg-bg-subtle px-3 py-2 text-sm text-fg"
                  : "self-end ml-auto max-w-[85%] rounded-sm bg-accent/10 px-3 py-2 text-sm text-fg"
              }
            >
              <p>{m.contenu}</p>
              <p className="mt-1 text-xs text-fg-muted">
                {m.auteur} · {m.canal} · {m.statut} · {new Date(m.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
          {(!messages || messages.length === 0) && (
            <p className="text-sm text-fg-muted">Aucun échange pour l&apos;instant.</p>
          )}
        </div>
      </div>
    </div>
  );
}
