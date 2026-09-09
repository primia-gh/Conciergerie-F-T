import Link from "next/link";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import { NotificationsBell, type NotificationRow } from "@/components/features/notifications-bell";
import { StatTile } from "@/components/features/stat-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getClientQuota } from "@/server/subscriptions/quota";
import {
  requestStatusBadgeVariant,
  requestStatusLabel,
  TERMINAL_STATUSES,
} from "@/server/requests/status-labels";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  concierge_id: string | null;
  categories: { name: string } | null;
};

type ActivityRow = {
  id: string;
  note: string | null;
  to_status: string;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const quota = profile ? await getClientQuota(supabase, profile.id) : null;

  const [
    { data: requests },
    { data: notifications },
    { data: profileDetails },
    { data: nextBooking },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, created_at, concierge_id, categories(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<RequestRow[]>(),
    supabase
      .from("notifications")
      .select("id, type, read_at, created_at")
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<NotificationRow[]>(),
    supabase
      .from("profiles")
      .select("created_at")
      .eq("id", profile?.id ?? "")
      .maybeSingle<{ created_at: string }>(),
    supabase
      .from("bookings")
      .select("scheduled_at")
      .in("status", ["pending", "confirmed"])
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ scheduled_at: string }>(),
    supabase
      .from("request_status_history")
      .select("id, note, to_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ActivityRow[]>(),
  ]);

  const conciergeIds = [...new Set((requests ?? []).map((r) => r.concierge_id).filter((id): id is string => !!id))];
  const { data: concierges } = conciergeIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", conciergeIds)
        .returns<{ id: string; first_name: string | null }[]>()
    : { data: [] as { id: string; first_name: string | null }[] };
  const conciergeNames = new Map((concierges ?? []).map((c) => [c.id, c.first_name ?? "votre concierge"]));

  const allRequests = requests ?? [];
  const activeRequests = allRequests.filter((r) => !TERMINAL_STATUSES.includes(r.status as never));
  const completedRequests = allRequests.filter((r) => TERMINAL_STATUSES.includes(r.status as never));

  const initial = (profile?.first_name?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-fg">
            Bonjour {profile?.first_name ?? ""}
          </h1>
          <p className="mt-1 text-fg-muted">Voici un aperçu de votre espace.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsBell notifications={notifications ?? []} currentPath="/client/dashboard" />
          <Link href="/" className="text-sm text-fg-muted hover:underline">
            Voir le site
          </Link>
          <Link href="/account" className="text-sm text-fg-muted hover:underline">
            Mon compte
          </Link>
          <SignOutButton />
        </div>
      </div>

      <Button asChild size="lg" variant={quota && !quota.canCreateRequest ? "secondary" : "primary"} className="mt-8">
        <Link href="/client/requests/new">Faire une demande</Link>
      </Button>
      {quota && !quota.canCreateRequest && (
        <p className="mt-2 text-sm text-fg-muted">
          Limite du forfait {quota.planName} atteinte —{" "}
          <Link href="/#tarifs" className="font-medium text-accent hover:underline">
            passer à un forfait supérieur
          </Link>
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Demandes actives" value={String(activeRequests.length)} />
        <StatTile label="Terminées" value={String(completedRequests.length)} />
        <StatTile
          label="Prochaine réservation"
          value={nextBooking?.scheduled_at ? formatDate(nextBooking.scheduled_at) : "—"}
          note={
            nextBooking?.scheduled_at
              ? new Date(nextBooking.scheduled_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Aucune pour le moment"
          }
        />
        <StatTile
          label="Forfait"
          value={quota?.planName ?? "—"}
          note={
            quota
              ? quota.requestLimit === null
                ? "Demandes illimitées"
                : `${quota.usedThisMonth}/${quota.requestLimit} ce mois-ci`
              : undefined
          }
        />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-accent-hover">
            En cours
          </h2>
          {activeRequests.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">Aucune demande active pour le moment.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {activeRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  conciergeName={request.concierge_id ? conciergeNames.get(request.concierge_id) : undefined}
                />
              ))}
            </ul>
          )}

          {completedRequests.length > 0 && (
            <>
              <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-fg-faint">
                Terminées
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {completedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    conciergeName={request.concierge_id ? conciergeNames.get(request.concierge_id) : undefined}
                    muted
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 font-display text-xl text-accent">
                {initial}
              </div>
              <p className="mt-4 font-display text-lg text-fg">{profile?.first_name}</p>
              {profileDetails?.created_at && (
                <p className="mt-1 text-sm text-fg-faint">
                  Membre depuis {formatMonthYear(profileDetails.created_at)}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                <Link href="/account" className="text-sm text-fg hover:underline">
                  Mon compte
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-faint">
                Activité récente
              </p>
              {!activity || activity.length === 0 ? (
                <p className="mt-3 text-sm text-fg-muted">Aucune activité pour le moment.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {activity.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p className="text-sm text-fg">{entry.note ?? requestStatusLabel(entry.to_status)}</p>
                        <p className="mt-0.5 text-xs text-fg-faint">{timeAgo(entry.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  conciergeName,
  muted,
}: {
  request: RequestRow;
  conciergeName?: string;
  muted?: boolean;
}) {
  return (
    <li>
      <Link href={`/client/requests/${request.id}`}>
        <Card className={muted ? "opacity-70 transition-opacity hover:opacity-100" : "transition-colors hover:bg-bg-subtle"}>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-fg">{request.title}</p>
                <Badge variant={requestStatusBadgeVariant(request.status)}>
                  {requestStatusLabel(request.status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-fg-faint">
                {request.categories?.name} · {formatDate(request.created_at)}
                {conciergeName ? ` · concierge ${conciergeName}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
