"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";

const createRequestSchema = z.object({
  categoryId: z.string().uuid("Catégorie invalide."),
  title: z.string().trim().min(3, "Le titre est trop court.").max(200),
  description: z.string().trim().min(10, "Décrivez votre besoin en quelques mots de plus.").max(4000),
  locationText: z.string().trim().max(300).optional().or(z.literal("")),
  requestedDate: z.string().optional().or(z.literal("")),
  requestedTime: z.string().optional().or(z.literal("")),
  budgetMin: z.coerce.number().nonnegative().optional().or(z.nan()),
  budgetMax: z.coerce.number().nonnegative().optional().or(z.nan()),
  preferences: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateRequestState = { error: string | null };

function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export async function createRequest(formData: FormData): Promise<CreateRequestState> {
  const profile = await assertRole("client");

  const parsed = createRequestSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description"),
    locationText: formData.get("locationText") ?? undefined,
    requestedDate: formData.get("requestedDate") ?? undefined,
    requestedTime: formData.get("requestedTime") ?? undefined,
    budgetMin: formData.get("budgetMin") || undefined,
    budgetMax: formData.get("budgetMax") || undefined,
    preferences: formData.get("preferences") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: request, error: insertError } = await supabase
    .from("requests")
    .insert({
      client_id: profile.id,
      category_id: data.categoryId,
      title: data.title,
      description: data.description,
      location_text: emptyToUndefined(data.locationText) ?? null,
      requested_date: emptyToUndefined(data.requestedDate) ?? null,
      requested_time: emptyToUndefined(data.requestedTime) ?? null,
      budget_min: Number.isNaN(data.budgetMin) ? null : data.budgetMin,
      budget_max: Number.isNaN(data.budgetMax) ? null : data.budgetMax,
      preferences: emptyToUndefined(data.preferences) ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !request) {
    return { error: "Impossible de créer la demande pour le moment. Réessayez." };
  }

  const { error: historyError } = await supabase.from("request_status_history").insert({
    request_id: request.id,
    from_status: null,
    to_status: "NEW",
    changed_by: profile.id,
    note: "Demande créée par le client.",
  });

  if (historyError) {
    // La demande existe déjà : on ne bloque pas l'utilisateur pour un souci
    // d'historisation, mais on ne le cache pas non plus (voir SECURITY.md, M14).
    console.error("[createRequest] request_status_history insert failed", historyError);
  }

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  for (const file of files) {
    const path = `${request.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("request-attachments")
      .upload(path, file);

    if (uploadError) {
      console.error("[createRequest] attachment upload failed", uploadError);
      continue;
    }

    await supabase.from("request_attachments").insert({
      request_id: request.id,
      uploaded_by: profile.id,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    });
  }

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}
