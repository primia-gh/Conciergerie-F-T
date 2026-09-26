import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VuePartenaires, type PartnerRow } from "./vue-partenaires";

export const metadata: Metadata = { title: "Partenaires" };

export default async function AdminPartnersPage() {
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from("partners")
    .select("id, name, status, email, phone, contact_name, categories(name, icon)")
    .order("name")
    .limit(100)
    .returns<PartnerRow[]>();

  return <VuePartenaires partenaires={partners ?? []} />;
}
