import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProspectRow = {
  id: string;
  type: string | null;
  adresse: string | null;
  disponibilite_souhaitee: string | null;
  created_at: string;
  proprietaire: { id: string; nom: string; email: string | null; statut: string } | null;
};

const STATUT_VARIANT: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  prospect: "accent",
  en_discussion: "warning",
  client: "success",
  perdu: "neutral",
};

export default async function AdminFtProspectsPage() {
  const supabase = await createClient();

  const { data: prospects } = await supabase
    .from("bien_prospect")
    .select(
      "id, type, adresse, disponibilite_souhaitee, created_at, proprietaire:proprietaire_id(id, nom, email, statut)",
    )
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<ProspectRow[]>();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-fg">Prospects F&amp;T</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/ft/offre" className="text-fg-muted hover:text-fg">
            Fiche offre
          </Link>
          <Link href="/admin/ft/regles" className="text-fg-muted hover:text-fg">
            Réglages d&apos;autonomie
          </Link>
        </div>
      </div>

      {!prospects || prospects.length === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">
          Aucun prospect pour l&apos;instant. Ils apparaîtront ici dès qu&apos;un propriétaire
          discute avec l&apos;agent sur la page /proprietaires.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {prospects.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/ft/${p.id}`}>
                <Card className="transition-colors hover:bg-bg-subtle">
                  <CardContent className="flex items-center justify-between pt-5">
                    <div>
                      <p className="font-medium text-fg">{p.proprietaire?.nom ?? "Prospect"}</p>
                      <p className="text-sm text-fg-muted">
                        {p.type ?? "Type non précisé"} · {p.adresse ?? "Adresse non précisée"}
                      </p>
                    </div>
                    <Badge variant={STATUT_VARIANT[p.proprietaire?.statut ?? "prospect"]}>
                      {p.proprietaire?.statut ?? "prospect"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
