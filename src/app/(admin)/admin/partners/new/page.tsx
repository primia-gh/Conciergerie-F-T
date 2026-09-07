import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPartner } from "@/server/partners/actions";
import { PartnerForm } from "../partner-form";

export default async function NewPartnerPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<{ id: string; name: string }[]>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/admin/partners" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux partenaires
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium text-fg">Nouveau partenaire</h1>
      <div className="mt-6">
        <PartnerForm categories={categories ?? []} action={createPartner} />
      </div>
    </div>
  );
}
