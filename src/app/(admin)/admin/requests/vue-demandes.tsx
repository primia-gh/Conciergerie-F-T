import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { EnTetePage, PAGE, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { ilYa } from "@/lib/dates";
import { REQUEST_STATUSES } from "@/server/requests/state-machine";
import {
  PRIORITE_LABELS,
  demandePrioritaire,
  requestStatusBadgeVariant,
  requestStatusLabel,
} from "@/server/requests/status-labels";

export type RequestRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  concierge_id: string | null;
  categories: { name: string; icon: string | null } | null;
};

export type DonneesDemandes = {
  demandes: RequestRow[];
  total: number;
  page: number;
  pages: number;
  filtres: { status: string; category: string; concierge: string };
  categories: { id: string; name: string }[];
  concierges: { id: string; nom: string }[];
};

function lienPage(f: DonneesDemandes["filtres"], page: number) {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.category) q.set("category", f.category);
  if (f.concierge) q.set("concierge", f.concierge);
  if (page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `/admin/requests?${qs}` : "/admin/requests";
}

/** Toutes les demandes Premium (présentation seule : les données viennent de page.tsx). */
export function VueDemandes({ d }: { d: DonneesDemandes }) {
  const f = d.filtres;
  const filtre = Boolean(f.status || f.category || f.concierge);
  const nomsConcierges = new Map(d.concierges.map((c) => [c.id, c.nom]));

  return (
    <div className={PAGE.moyenne}>
      <EnTetePage surtitre="Conciergerie Premium" titre="Demandes">
        Toutes les demandes des clients Premium, de la plus récente à la plus ancienne.
      </EnTetePage>

      <form method="get" className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end sm:p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Statut</Label>
          <NativeSelect id="status" name="status" defaultValue={f.status}>
            <option value="">Tous</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {requestStatusLabel(s, true)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Catégorie</Label>
          <NativeSelect id="category" name="category" defaultValue={f.category}>
            <option value="">Toutes</option>
            {d.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="concierge">Concierge</Label>
          <NativeSelect id="concierge" name="concierge" defaultValue={f.concierge}>
            <option value="">Tous</option>
            {d.concierges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
          {filtre && (
            <Button asChild variant="ghost">
              <Link href="/admin/requests">Tout voir</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-fg-muted" role="status">
        {d.total} demande{d.total > 1 ? "s" : ""}
        {d.pages > 1 ? ` · page ${d.page} sur ${d.pages}` : ""}
      </p>

      {d.demandes.length === 0 ? (
        <EtatVide icone={Inbox} titre={filtre ? "Aucune demande ne correspond" : "Aucune demande pour l'instant"} className="mt-4">
          {filtre ? "Élargissez les filtres pour en voir davantage." : "Les demandes des clients Premium apparaîtront ici."}
        </EtatVide>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {d.demandes.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/requests/${r.id}`} className={carteLien}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <IconeCategorie nom={r.categories?.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="truncate font-medium text-fg">{r.title}</span>
                    <Badge variant={requestStatusBadgeVariant(r.status)}>{requestStatusLabel(r.status, true)}</Badge>
                    {demandePrioritaire(r.priority) && (
                      <Badge variant={r.priority === "urgent" ? "warning" : "accent"}>{PRIORITE_LABELS[r.priority]}</Badge>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-fg-muted">
                    {[
                      r.categories?.name,
                      r.concierge_id ? (nomsConcierges.get(r.concierge_id) ?? "Concierge") : "Sans concierge",
                      ilYa(r.created_at),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {d.pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pages">
          {d.page > 1 ? (
            <Button asChild variant="ghost">
              <Link href={lienPage(f, d.page - 1)}>
                <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Précédentes
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" disabled>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Précédentes
            </Button>
          )}
          <span className="px-2 text-sm text-fg-muted">
            {d.page} / {d.pages}
          </span>
          {d.page < d.pages ? (
            <Button asChild variant="ghost">
              <Link href={lienPage(f, d.page + 1)}>
                Suivantes <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" disabled>
              Suivantes <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
