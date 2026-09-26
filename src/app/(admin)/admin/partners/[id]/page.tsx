import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePartner } from "@/server/partners/actions";
import { EnTetePage, LienRetour, PAGE } from "@/components/espace/en-tete";
import { STATUT_PARTENAIRE, libelle } from "@/components/espace/libelles";
import { Badge } from "@/components/ui/badge";
import { PartnerForm, type PartnerFormValues } from "../partner-form";

export const metadata: Metadata = { title: "Partenaire" };

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
    <div className={PAGE.etroite}>
      <LienRetour href="/admin/partners">Partenaires</LienRetour>
      <EnTetePage
        surtitre="Conciergerie Premium"
        titre={partner.name}
        actions={<Badge variant={libelle(STATUT_PARTENAIRE, partner.status).variante}>{libelle(STATUT_PARTENAIRE, partner.status).libelle}</Badge>}
      />
      <div className="mt-8">
        <PartnerForm categories={categories ?? []} partner={values} action={updatePartner.bind(null, id)} />
      </div>
    </div>
  );
}
