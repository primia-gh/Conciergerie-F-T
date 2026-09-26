import Link from "next/link";
import { ChevronRight, Handshake, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnTetePage, PAGE, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { STATUT_PARTENAIRE, libelle } from "@/components/espace/libelles";

export type PartnerRow = {
  id: string;
  name: string;
  status: string;
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  categories: { name: string; icon: string | null } | null;
};

const bouton = (
  <Button asChild>
    <Link href="/admin/partners/new">
      <Plus aria-hidden="true" className="h-4 w-4" />
      Ajouter un partenaire
    </Link>
  </Button>
);

/** Liste des partenaires Premium (présentation seule : les données viennent de page.tsx). */
export function VuePartenaires({ partenaires }: { partenaires: PartnerRow[] }) {
  const actifs = partenaires.filter((p) => p.status === "active").length;

  return (
    <div className={PAGE.moyenne}>
      <EnTetePage surtitre="Conciergerie Premium" titre="Partenaires" actions={partenaires.length > 0 ? bouton : undefined}>
        {partenaires.length > 0
          ? `${actifs} actif${actifs > 1 ? "s" : ""} sur ${partenaires.length}. Seuls les partenaires actifs sont proposés aux concierges dans leurs propositions.`
          : "Restaurants, chauffeurs, hôtels… : les prestataires que les concierges peuvent proposer aux clients."}
      </EnTetePage>

      {partenaires.length === 0 ? (
        <EtatVide icone={Handshake} titre="Aucun partenaire pour l'instant" className="mt-10" action={bouton}>
          Ajoutez vos prestataires habituels : les concierges pourront les rattacher aux options qu&apos;ils
          proposent.
        </EtatVide>
      ) : (
        <ul className="mt-10 flex flex-col gap-3">
          {partenaires.map((p) => {
            const s = libelle(STATUT_PARTENAIRE, p.status);
            return (
              <li key={p.id}>
                <Link href={`/admin/partners/${p.id}`} className={carteLien}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <IconeCategorie nom={p.categories?.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate font-medium text-fg">{p.name}</span>
                      <Badge variant={s.variante}>{s.libelle}</Badge>
                    </span>
                    <span className="mt-1 block truncate text-sm text-fg-muted">
                      {[p.categories?.name ?? "Sans catégorie", p.contact_name, p.email ?? p.phone].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
