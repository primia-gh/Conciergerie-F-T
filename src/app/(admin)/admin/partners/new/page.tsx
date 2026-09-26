import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createPartner } from "@/server/partners/actions";
import { EnTetePage, LienRetour, PAGE } from "@/components/espace/en-tete";
import { PartnerForm } from "../partner-form";

export const metadata: Metadata = { title: "Nouveau partenaire" };

export default async function NewPartnerPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<{ id: string; name: string }[]>();

  return (
    <div className={PAGE.etroite}>
      <LienRetour href="/admin/partners">Partenaires</LienRetour>
      <EnTetePage surtitre="Conciergerie Premium" titre="Nouveau partenaire">
        Il sera proposé aux concierges dès qu&apos;il est « Actif ».
      </EnTetePage>
      <div className="mt-8">
        <PartnerForm categories={categories ?? []} action={createPartner} />
      </div>
    </div>
  );
}
