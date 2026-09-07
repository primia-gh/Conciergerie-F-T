import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePartner } from "@/server/partners/actions";
import { PartnerForm, type PartnerFormValues } from "../partner-form";

export default async function EditPartnerPage({ params }: PageProps<"/admin/partners/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: partner }, { data: categories }] = await Promise.all([
    supabase
      .from("partners")
      .select(
        "name, category_id, contact_name, email, phone, address, website, commission_rate, status, notes",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
  ]);

  if (!partner) {
    notFound();
  }

  const values: PartnerFormValues = {
    name: partner.name,
    categoryId: partner.category_id,
    contactName: partner.contact_name,
    email: partner.email,
    phone: partner.phone,
    address: partner.address,
    website: partner.website,
    commissionRate: partner.commission_rate,
    status: partner.status,
    notes: partner.notes,
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/admin/partners" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux partenaires
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium text-fg">{partner.name}</h1>
      <div className="mt-6">
        <PartnerForm categories={categories ?? []} partner={values} action={updatePartner.bind(null, id)} />
      </div>
    </div>
  );
}
