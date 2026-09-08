import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PartnerRow = {
  id: string;
  name: string;
  status: string;
  email: string | null;
  categories: { name: string } | null;
};

export default async function AdminPartnersPage() {
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partners")
    .select("id, name, status, email, categories(name)")
    .order("name")
    .limit(100)
    .returns<PartnerRow[]>();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-fg">Partenaires</h1>
        <Button asChild>
          <Link href="/admin/partners/new">Ajouter un partenaire</Link>
        </Button>
      </div>

      {!partners || partners.length === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">Aucun partenaire pour l&apos;instant.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {partners.map((partner) => (
            <li key={partner.id}>
              <Link href={`/admin/partners/${partner.id}`}>
                <Card className="transition-colors hover:bg-bg-subtle">
                  <CardContent className="flex items-center justify-between pt-5">
                    <div>
                      <p className="font-medium text-fg">{partner.name}</p>
                      <p className="text-sm text-fg-muted">
                        {partner.categories?.name ?? "—"} · {partner.email ?? "Pas d'email"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        partner.status === "active"
                          ? "success"
                          : partner.status === "pending"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {partner.status}
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
