"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";

export async function markNotificationRead(notificationId: string, path: string): Promise<void> {
  const profile = await assertRole("client", "concierge", "admin", "partner");
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  revalidatePath(path);
}
