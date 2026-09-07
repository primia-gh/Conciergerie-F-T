import Link from "next/link";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
};

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, status, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-fg">
            Bonjour {profile?.first_name ?? ""}
          </h1>
          <p className="mt-1 text-fg-muted">Comment puis-je vous aider ?</p>
        </div>
        <SignOutButton />
      </div>

      <Button asChild size="lg" className="mt-8">
        <Link href="/client/requests/new">Faire une demande</Link>
      </Button>

      <div className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Mes demandes
        </h2>
        {!requests || requests.length === 0 ? (
          <p className="mt-3 text-sm text-fg-muted">Aucune demande pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Card>
                  <CardContent className="flex items-center justify-between pt-5">
                    <div>
                      <p className="font-medium text-fg">{request.title}</p>
                      <p className="text-sm text-fg-muted">{request.categories?.name}</p>
                    </div>
                    <Badge variant="accent">{request.status}</Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-fg-muted">
        Messages — NOT IMPLEMENTED (Phase M7)
      </div>
    </div>
  );
}
