import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RequestWizard } from "./request-wizard";

export const metadata: Metadata = { title: "Nouvelle demande" };

export type CategoryOption = { id: string; name: string; slug: string };

export default async function NewRequestPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("active", true)
    .order("name")
    .returns<CategoryOption[]>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <RequestWizard categories={categories ?? []} />
    </div>
  );
}
