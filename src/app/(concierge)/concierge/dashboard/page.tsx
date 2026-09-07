import Link from "next/link";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import { NotificationsBell, type NotificationRow } from "@/components/features/notifications-bell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  categories: { name: string } | null;
};

function RequestList({ requests, emptyLabel }: { requests: RequestRow[]; emptyLabel: string }) {
  if (requests.length === 0) {
    return <p className="mt-3 text-sm text-fg-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-3">
      {requests.map((request) => (
        <li key={request.id}>
          <Link href={`/concierge/requests/${request.id}`}>
            <Card className="transition-colors hover:bg-bg-subtle">
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="font-medium text-fg">{request.title}</p>
                  <p className="text-sm text-fg-muted">{request.categories?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {request.priority !== "normal" && (
                    <Badge variant="warning">{request.priority}</Badge>
                  )}
                  <Badge variant="accent">{request.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ConciergeDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: newRequests }, { data: myRequests }, { data: notifications }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, priority, created_at, categories(name)")
      .is("concierge_id", null)
      .eq("status", "NEW")
      .order("created_at", { ascending: true })
      .returns<RequestRow[]>(),
    supabase
      .from("requests")
      .select("id, title, status, priority, created_at, categories(name)")
      .eq("concierge_id", profile?.id ?? "")
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
    supabase
      .from("notifications")
      .select("id, type, read_at, created_at")
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<NotificationRow[]>(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-fg">
            Bonjour {profile?.first_name ?? ""}
          </h1>
          <p className="mt-1 text-fg-muted">Voici les demandes qui vous attendent.</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell notifications={notifications ?? []} currentPath="/concierge/dashboard" />
          <Link href="/account" className="text-sm text-fg-muted hover:underline">
            Mon compte
          </Link>
          <SignOutButton />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Nouvelles demandes
        </h2>
        <RequestList requests={newRequests ?? []} emptyLabel="Aucune nouvelle demande." />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Mes demandes
        </h2>
        <RequestList requests={myRequests ?? []} emptyLabel="Vous n'avez pas encore de demande assignée." />
      </section>
    </div>
  );
}
