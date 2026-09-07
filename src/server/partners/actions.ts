"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";

const partnerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court.").max(200),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  contactName: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  commissionRate: z.coerce.number().min(0).max(100).optional().or(z.nan()),
  status: z.enum(["active", "inactive", "pending"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PartnerFormState = { error: string | null };

function emptyToNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createPartner(
  _prevState: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  await assertRole("admin");

  const parsed = partnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("partners").insert({
    name: data.name,
    category_id: emptyToNull(data.categoryId),
    contact_name: emptyToNull(data.contactName),
    email: emptyToNull(data.email),
    phone: emptyToNull(data.phone),
    address: emptyToNull(data.address),
    website: emptyToNull(data.website),
    commission_rate: Number.isNaN(data.commissionRate) ? null : data.commissionRate,
    status: data.status,
    notes: emptyToNull(data.notes),
  });

  if (error) {
    return { error: "Impossible de créer le partenaire." };
  }

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

export async function updatePartner(
  partnerId: string,
  _prevState: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  await assertRole("admin");

  const parsed = partnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("partners")
    .update({
      name: data.name,
      category_id: emptyToNull(data.categoryId),
      contact_name: emptyToNull(data.contactName),
      email: emptyToNull(data.email),
      phone: emptyToNull(data.phone),
      address: emptyToNull(data.address),
      website: emptyToNull(data.website),
      commission_rate: Number.isNaN(data.commissionRate) ? null : data.commissionRate,
      status: data.status,
      notes: emptyToNull(data.notes),
    })
    .eq("id", partnerId);

  if (error) {
    return { error: "Impossible de mettre à jour le partenaire." };
  }

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}
